import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export function useNewEpisodeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const followedSeriesRef = useRef<Set<string>>(new Set());

  // Keep followed series in sync
  useEffect(() => {
    if (!user) return;
    const fetchFollows = async () => {
      const { data } = await supabase
        .from("series_follows")
        .select("series_id")
        .eq("user_id", user.id);
      followedSeriesRef.current = new Set((data ?? []).map((f) => f.series_id));
    };
    fetchFollows();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("new-episodes-listener")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "episodes" },
        async (payload) => {
          const ep = payload.new as {
            id: string;
            title: string;
            episode_number: number;
            series_id: string;
            is_published: boolean;
          };
          if (!ep.is_published) return;
          if (!followedSeriesRef.current.has(ep.series_id)) return;

          // Fetch series name
          const { data: series } = await supabase
            .from("series")
            .select("title")
            .eq("id", ep.series_id)
            .single();

          const seriesTitle = series?.title ?? "Série";
          const notifTitle = `Novo episódio em ${seriesTitle}`;
          const notifBody = `Ep. ${ep.episode_number} — ${ep.title} já está disponível!`;

          // Show toast
          toast.success(notifTitle, {
            description: notifBody,
            action: {
              label: "Assistir agora →",
              onClick: () => { window.location.href = `/watch/${ep.id}`; },
            },
            duration: 8000,
          });

          // Persist notification
          await supabase.from("notifications").insert({
            user_id: user.id,
            title: notifTitle,
            body: notifBody,
            series_id: ep.series_id,
            episode_id: ep.id,
          });

          queryClient.invalidateQueries({ queryKey: ["notifications-unread", user.id] });
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "episodes" },
        async (payload) => {
          const ep = payload.new as {
            id: string;
            title: string;
            episode_number: number;
            series_id: string;
            is_published: boolean;
          };
          const prev = payload.old as { is_published: boolean };
          // Only fire when it transitions from unpublished → published
          if (!ep.is_published || prev.is_published) return;
          if (!followedSeriesRef.current.has(ep.series_id)) return;

          const { data: series } = await supabase
            .from("series")
            .select("title")
            .eq("id", ep.series_id)
            .single();

          const seriesTitle = series?.title ?? "Série";
          const notifTitle = `Novo episódio em ${seriesTitle}`;
          const notifBody = `Ep. ${ep.episode_number} — ${ep.title} já está disponível!`;

          toast.success(notifTitle, {
            description: notifBody,
            action: {
              label: "Assistir agora →",
              onClick: () => { window.location.href = `/watch/${ep.id}`; },
            },
            duration: 8000,
          });

          await supabase.from("notifications").insert({
            user_id: user.id,
            title: notifTitle,
            body: notifBody,
            series_id: ep.series_id,
            episode_id: ep.id,
          });

          queryClient.invalidateQueries({ queryKey: ["notifications-unread", user.id] });
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
