import { supabase } from "@/integrations/supabase/client";

export async function canAccessEpisode(userId: string, episodeId: string): Promise<boolean> {
  const { data: ep } = await supabase
    .from("episodes")
    .select("is_free, episode_number, series_id")
    .eq("id", episodeId)
    .single();
  if (!ep) return false;
  if (ep.is_free) return true;

  const { data: series } = await supabase
    .from("series")
    .select("free_episodes")
    .eq("id", ep.series_id)
    .single();
  if (series && ep.episode_number <= series.free_episodes) return true;

  const { data: su } = await supabase
    .from("series_unlocks")
    .select("id")
    .eq("user_id", userId)
    .eq("series_id", ep.series_id)
    .maybeSingle();
  if (su) return true;

  const { data: eu } = await supabase
    .from("episode_unlocks")
    .select("id")
    .eq("user_id", userId)
    .eq("episode_id", episodeId)
    .maybeSingle();
  return !!eu;
}

export async function unlockEpisode(episodeId: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke("unlock-episode", {
    body: { episode_id: episodeId },
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (res.error) throw res.error;
  return res.data;
}

export async function unlockSeries(seriesId: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke("unlock-episode", {
    body: { series_id: seriesId },
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (res.error) throw res.error;
  return res.data;
}
