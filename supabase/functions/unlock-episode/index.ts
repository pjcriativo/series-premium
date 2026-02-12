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
    const userId = user.id;

    const { episode_id, series_id } = await req.json();

    if (!episode_id && !series_id) {
      return new Response(
        JSON.stringify({ error: "episode_id or series_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine episodes to unlock
    let episodesToUnlock: { id: string; price_coins: number; is_free: boolean; episode_number: number }[] = [];
    let seriesFreeEpisodes = 0;

    if (series_id) {
      // Get series info
      const { data: seriesData } = await supabaseAdmin
        .from("series")
        .select("free_episodes")
        .eq("id", series_id)
        .single();
      seriesFreeEpisodes = seriesData?.free_episodes ?? 0;

      const { data: eps, error } = await supabaseAdmin
        .from("episodes")
        .select("id, price_coins, is_free, episode_number")
        .eq("series_id", series_id);
      if (error) throw error;
      // Only charge for episodes that aren't free by any rule
      episodesToUnlock = eps.filter((e: any) => !e.is_free && e.episode_number > seriesFreeEpisodes);
    } else {
      const { data: ep, error } = await supabaseAdmin
        .from("episodes")
        .select("id, price_coins, is_free, series_id, episode_number")
        .eq("id", episode_id)
        .single();
      if (error) throw error;

      // Check free rules
      const { data: seriesData } = await supabaseAdmin
        .from("series")
        .select("free_episodes")
        .eq("id", ep.series_id)
        .single();
      seriesFreeEpisodes = seriesData?.free_episodes ?? 0;

      if (ep.is_free || ep.episode_number <= seriesFreeEpisodes) {
        return new Response(
          JSON.stringify({ success: true, message: "Episode is free" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      episodesToUnlock = [ep];
    }

    // Check already unlocked (episode_unlocks)
    const epIds = episodesToUnlock.map((e) => e.id);
    const { data: existingUnlocks } = await supabaseAdmin
      .from("episode_unlocks")
      .select("episode_id")
      .eq("user_id", userId)
      .in("episode_id", epIds);

    const alreadyUnlocked = new Set((existingUnlocks ?? []).map((u: any) => u.episode_id));

    // Also check series_unlocks
    if (series_id) {
      const { data: su } = await supabaseAdmin
        .from("series_unlocks")
        .select("id")
        .eq("user_id", userId)
        .eq("series_id", series_id)
        .maybeSingle();
      if (su) {
        return new Response(
          JSON.stringify({ success: true, message: "Already unlocked" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const toUnlock = episodesToUnlock.filter((e) => !alreadyUnlocked.has(e.id));

    if (toUnlock.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Already unlocked" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalCost = toUnlock.reduce((sum, e) => sum + e.price_coins, 0);

    // Get user wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();
    if (walletError) throw walletError;

    if (wallet.balance < totalCost) {
      return new Response(
        JSON.stringify({
          error: "Insufficient balance",
          required: totalCost,
          current: wallet.balance,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct balance
    const { error: updateError } = await supabaseAdmin
      .from("wallets")
      .update({ balance: wallet.balance - totalCost })
      .eq("user_id", userId);
    if (updateError) throw updateError;

    // Insert transaction
    const { error: txError } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "debit",
      reason: series_id ? "series_unlock" : "episode_unlock",
      coins: totalCost,
      ref_id: series_id ?? episode_id,
    });
    if (txError) throw txError;

    if (series_id) {
      // Insert series unlock
      await supabaseAdmin.from("series_unlocks").insert({
        user_id: userId,
        series_id: series_id,
      });
      // Also insert individual episode unlocks
      const unlockRecords = toUnlock.map((e) => ({
        user_id: userId,
        episode_id: e.id,
      }));
      await supabaseAdmin.from("episode_unlocks").insert(unlockRecords);
    } else {
      // Insert single episode unlock
      await supabaseAdmin.from("episode_unlocks").insert({
        user_id: userId,
        episode_id: episode_id,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        unlocked: toUnlock.length,
        spent: totalCost,
        new_balance: wallet.balance - totalCost,
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
