import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const body = await req.json();

    // Admin grant flow
    if (body.admin_grant) {
      // Verify caller is admin
      const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const targetUserId = body.target_user_id;
      const coins = body.coins; // positive = credit, negative = debit

      const { data: wallet } = await supabaseAdmin.from("wallets").select("balance").eq("user_id", targetUserId).single();
      if (!wallet) throw new Error("Wallet not found");

      const newBalance = wallet.balance + coins;
      if (newBalance < 0) {
        return new Response(
          JSON.stringify({ error: "Saldo insuficiente" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabaseAdmin.from("wallets").update({ balance: newBalance }).eq("user_id", targetUserId);
      await supabaseAdmin.from("transactions").insert({
        user_id: targetUserId,
        type: coins > 0 ? "credit" : "debit",
        reason: "admin_adjust",
        coins: Math.abs(coins),
        ref_id: user.id,
      });

      return new Response(
        JSON.stringify({ success: true, coins_adjusted: coins, new_balance: newBalance }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normal purchase flow
    const { package_id } = body;

    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from("coin_packages")
      .select("*")
      .eq("id", package_id)
      .eq("is_active", true)
      .single();
    if (pkgError || !pkg) {
      return new Response(
        JSON.stringify({ error: "Invalid package" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single();
    if (walletError) throw walletError;

    const newBalance = wallet.balance + pkg.coins;

    // Update balance
    const { error: updateError } = await supabaseAdmin
      .from("wallets")
      .update({ balance: newBalance })
      .eq("user_id", user.id);
    if (updateError) throw updateError;

    // Record transaction
    const { error: txError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "credit",
        reason: "purchase",
        coins: pkg.coins,
        ref_id: pkg.id,
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
