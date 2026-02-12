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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { episode_id, series_id } = await req.json();

    if (!episode_id && !series_id) {
      return new Response(
        JSON.stringify({ error: "episode_id or series_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine episodes to unlock
    let episodesToUnlock: { id: string; coin_cost: number; is_free: boolean }[] = [];

    if (series_id) {
      const { data: eps, error } = await supabaseAdmin
        .from("episodes")
        .select("id, coin_cost, is_free")
        .eq("series_id", series_id);
      if (error) throw error;
      episodesToUnlock = eps.filter((e: any) => !e.is_free);
    } else {
      const { data: ep, error } = await supabaseAdmin
        .from("episodes")
        .select("id, coin_cost, is_free, series_id")
        .eq("id", episode_id)
        .single();
      if (error) throw error;
      if (ep.is_free) {
        return new Response(
          JSON.stringify({ success: true, message: "Episode is free" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      episodesToUnlock = [ep];
    }

    // Check already unlocked
    const epIds = episodesToUnlock.map((e) => e.id);
    const { data: existingUnlocks } = await supabaseAdmin
      .from("user_unlocks")
      .select("episode_id")
      .eq("user_id", userId)
      .in("episode_id", epIds);

    const alreadyUnlocked = new Set((existingUnlocks ?? []).map((u: any) => u.episode_id));
    const toUnlock = episodesToUnlock.filter((e) => !alreadyUnlocked.has(e.id));

    if (toUnlock.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Already unlocked" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalCost = toUnlock.reduce((sum, e) => sum + e.coin_cost, 0);

    // Get user balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("coin_balance")
      .eq("id", userId)
      .single();
    if (profileError) throw profileError;

    if (profile.coin_balance < totalCost) {
      return new Response(
        JSON.stringify({
          error: "Insufficient balance",
          required: totalCost,
          current: profile.coin_balance,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct balance
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ coin_balance: profile.coin_balance - totalCost })
      .eq("id", userId);
    if (updateError) throw updateError;

    // Insert transaction
    const { error: txError } = await supabaseAdmin.from("coin_transactions").insert({
      user_id: userId,
      amount: totalCost,
      type: "spend",
      description: series_id
        ? `Unlocked series`
        : `Unlocked episode`,
    });
    if (txError) throw txError;

    // Insert unlocks
    const unlockRecords = toUnlock.map((e) => ({
      user_id: userId,
      episode_id: e.id,
      series_id: series_id || null,
    }));
    const { error: unlockError } = await supabaseAdmin
      .from("user_unlocks")
      .insert(unlockRecords);
    if (unlockError) throw unlockError;

    return new Response(
      JSON.stringify({
        success: true,
        unlocked: toUnlock.length,
        spent: totalCost,
        new_balance: profile.coin_balance - totalCost,
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
