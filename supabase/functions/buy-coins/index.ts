import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PACKAGES = [
  { id: "starter", coins: 50, label: "Starter" },
  { id: "popular", coins: 150, label: "Popular" },
  { id: "premium", coins: 500, label: "Premium" },
  { id: "ultra", coins: 1200, label: "Ultra" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { package_id } = await req.json();
    const pkg = PACKAGES.find((p) => p.id === package_id);
    if (!pkg) {
      return new Response(
        JSON.stringify({ error: "Invalid package", available: PACKAGES }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("coin_balance")
      .eq("id", user.id)
      .single();
    if (profileError) throw profileError;

    const newBalance = profile.coin_balance + pkg.coins;

    // Update balance
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ coin_balance: newBalance })
      .eq("id", user.id);
    if (updateError) throw updateError;

    // Record transaction
    const { error: txError } = await supabaseAdmin
      .from("coin_transactions")
      .insert({
        user_id: user.id,
        amount: pkg.coins,
        type: "purchase",
        description: `Purchased ${pkg.label} package (${pkg.coins} coins)`,
      });
    if (txError) throw txError;

    return new Response(
      JSON.stringify({
        success: true,
        coins_added: pkg.coins,
        new_balance: newBalance,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
