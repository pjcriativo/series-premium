import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret) {
    return new Response(JSON.stringify({ error: "Stripe not configured yet" }), {
      status: 501,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();

  // Verify Stripe signature
  const sigHeader = req.headers.get("stripe-signature");
  if (!sigHeader) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const parts: Record<string, string> = {};
  for (const part of sigHeader.split(",")) {
    const idx = part.indexOf("=");
    if (idx !== -1) {
      parts[part.slice(0, idx).trim()] = part.slice(idx + 1);
    }
  }

  if (!parts.t || !parts.v1) {
    return new Response("Invalid stripe-signature format", { status: 400 });
  }

  const payload = `${parts.t}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computed !== parts.v1) {
    return new Response("Invalid signature", { status: 400 });
  }

  // Optionally reject old timestamps (5 min tolerance)
  const tolerance = 5 * 60;
  const ts = parseInt(parts.t, 10);
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > tolerance) {
    return new Response("Timestamp too old", { status: 400 });
  }

  // Parse event
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true, ignored: event.type }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = event.data?.object;
  const userId = session?.metadata?.user_id;
  const packageId = session?.metadata?.package_id;

  if (!userId || !packageId) {
    return new Response("Missing metadata (user_id or package_id)", { status: 400 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Idempotency check
  const { data: existing } = await supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("ref_id", event.id)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ already_processed: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Look up package
  const { data: pkg, error: pkgError } = await supabaseAdmin
    .from("coin_packages")
    .select("coins")
    .eq("id", packageId)
    .single();

  if (pkgError || !pkg) {
    return new Response(`Package not found: ${packageId}`, { status: 400 });
  }

  // Update wallet
  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (!wallet) {
    return new Response(`Wallet not found for user: ${userId}`, { status: 400 });
  }

  const newBalance = wallet.balance + pkg.coins;

  const { error: updateError } = await supabaseAdmin
    .from("wallets")
    .update({ balance: newBalance })
    .eq("user_id", userId);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Record transaction
  const { error: txError } = await supabaseAdmin
    .from("transactions")
    .insert({
      user_id: userId,
      type: "credit",
      reason: "purchase",
      coins: pkg.coins,
      ref_id: event.id,
    });

  if (txError) {
    return new Response(JSON.stringify({ error: txError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ success: true, coins_credited: pkg.coins, new_balance: newBalance }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
