import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useCallback } from "react";

export const formatCount = (n: number) => {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
};

export const useEpisodeSocial = (episodeId?: string) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: likeCount = 0 } = useQuery({
    queryKey: ["episode-likes-count", episodeId],
    queryFn: async () => {
      const { count } = await supabase
        .from("episode_likes" as any)
        .select("*", { count: "exact", head: true })
        .eq("episode_id", episodeId!);
      return count ?? 0;
    },
    enabled: !!episodeId,
  });

  const { data: favoriteCount = 0 } = useQuery({
    queryKey: ["episode-favorites-count", episodeId],
    queryFn: async () => {
      const { count } = await supabase
        .from("episode_favorites" as any)
        .select("*", { count: "exact", head: true })
        .eq("episode_id", episodeId!);
      return count ?? 0;
    },
    enabled: !!episodeId,
  });

  const { data: hasLiked = false } = useQuery({
    queryKey: ["episode-liked", episodeId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("episode_likes" as any)
        .select("id")
        .eq("episode_id", episodeId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!episodeId && !!user,
  });

  const { data: hasFavorited = false } = useQuery({
    queryKey: ["episode-favorited", episodeId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("episode_favorites" as any)
        .select("id")
        .eq("episode_id", episodeId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!episodeId && !!user,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["episode-likes-count", episodeId] });
    queryClient.invalidateQueries({ queryKey: ["episode-liked", episodeId] });
    queryClient.invalidateQueries({ queryKey: ["episode-favorites-count", episodeId] });
    queryClient.invalidateQueries({ queryKey: ["episode-favorited", episodeId] });
  }, [queryClient, episodeId]);

  const toggleLike = useCallback(async () => {
    if (!user) { navigate("/auth"); return; }
    if (!episodeId) return;
    if (hasLiked) {
      await supabase.from("episode_likes" as any).delete().eq("episode_id", episodeId).eq("user_id", user.id);
    } else {
      await supabase.from("episode_likes" as any).insert({ episode_id: episodeId, user_id: user.id });
    }
    invalidate();
  }, [user, episodeId, hasLiked, navigate, invalidate]);

  const toggleFavorite = useCallback(async () => {
    if (!user) { navigate("/auth"); return; }
    if (!episodeId) return;
    if (hasFavorited) {
      await supabase.from("episode_favorites" as any).delete().eq("episode_id", episodeId).eq("user_id", user.id);
    } else {
      await supabase.from("episode_favorites" as any).insert({ episode_id: episodeId, user_id: user.id });
    }
    invalidate();
  }, [user, episodeId, hasFavorited, navigate, invalidate]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado!" });
    }
  }, []);

  return { likeCount, favoriteCount, hasLiked, hasFavorited, toggleLike, toggleFavorite, handleShare, formatCount };
};
