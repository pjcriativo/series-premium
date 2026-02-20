import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff } from "lucide-react";
import { getSeriesCover } from "@/lib/demo-covers";
import { toast } from "sonner";

const NotificationSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Series the user has progress on (watched series)
  const { data: progressList } = useQuery({
    queryKey: ["user-progress-all", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("series_id")
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const seriesIds = progressList?.map((p) => p.series_id) ?? [];

  const { data: watchedSeries, isLoading: seriesLoading } = useQuery({
    queryKey: ["watched-series-notif", seriesIds],
    queryFn: async () => {
      const { data } = await supabase
        .from("series")
        .select("id, title, cover_url")
        .in("id", seriesIds);
      return data ?? [];
    },
    enabled: seriesIds.length > 0,
  });

  const { data: follows, isLoading: followsLoading } = useQuery({
    queryKey: ["series-follows", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("series_follows")
        .select("series_id")
        .eq("user_id", user!.id);
      return new Set((data ?? []).map((f) => f.series_id));
    },
    enabled: !!user,
  });

  const followMutation = useMutation({
    mutationFn: async ({ seriesId, follow }: { seriesId: string; follow: boolean }) => {
      if (follow) {
        const { error } = await supabase
          .from("series_follows")
          .insert({ user_id: user!.id, series_id: seriesId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("series_follows")
          .delete()
          .eq("user_id", user!.id)
          .eq("series_id", seriesId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { follow }) => {
      queryClient.invalidateQueries({ queryKey: ["series-follows", user?.id] });
      toast.success(follow ? "Alerta ativado!" : "Alerta desativado");
    },
    onError: () => toast.error("Erro ao atualizar preferência"),
  });

  const isLoading = seriesLoading || followsLoading;

  return (
    <section className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Bell className="h-4 w-4 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">Alertas de Novos Episódios</p>
          <p className="text-xs text-muted-foreground">Seja notificado quando novos episódios forem lançados</p>
        </div>
      </div>

      {isLoading ? (
        <div className="divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="w-10 h-14 rounded-md flex-shrink-0" />
              <Skeleton className="flex-1 h-4 rounded" />
              <Skeleton className="w-10 h-5 rounded-full" />
            </div>
          ))}
        </div>
      ) : !watchedSeries || watchedSeries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-2">
          <BellOff className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhuma série assistida ainda.</p>
          <p className="text-xs text-muted-foreground/70">
            Comece a assistir séries para ativar alertas de novos episódios.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {watchedSeries.map((series) => {
            const cover = getSeriesCover(series.id, series.cover_url);
            const isFollowing = follows?.has(series.id) ?? false;
            return (
              <li key={series.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-14 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                  {cover ? (
                    <img src={cover} alt={series.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                      <span className="text-muted-foreground text-sm font-bold">{series.title.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <p className="flex-1 text-sm font-medium text-foreground truncate">{series.title}</p>
                <Switch
                  checked={isFollowing}
                  onCheckedChange={(checked) =>
                    followMutation.mutate({ seriesId: series.id, follow: checked })
                  }
                  disabled={followMutation.isPending}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default NotificationSettings;
