import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type Notification = {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  episode_id: string | null;
  series_id: string | null;
};

const NotificationBell = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, is_read, created_at, episode_id, series_id")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(15);
      return (data ?? []) as Notification[];
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const unread = (notifications ?? []).filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    const ids = (notifications ?? []).filter((n) => !n.is_read).map((n) => n.id);
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", ids);
    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
  };

  if (!user) return null;

  return (
    <Popover onOpenChange={(open) => { if (open) markAllRead(); }}>
      <PopoverTrigger asChild>
        <button className="relative cursor-pointer p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <Bell className="h-5 w-5 text-white" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
          {unread > 0 && (
            <span className="text-xs text-muted-foreground">{unread} não lida{unread > 1 ? "s" : ""}</span>
          )}
        </div>

        <ScrollArea className="max-h-[360px]">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-2">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação ainda.</p>
              <p className="text-xs text-muted-foreground/70">Siga séries para receber alertas de novos episódios.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => {
                const href = n.episode_id ? `/watch/${n.episode_id}` : n.series_id ? `/series/${n.series_id}` : null;
                const Inner = (
                  <div className={`px-4 py-3 hover:bg-muted/50 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}>
                    <div className="flex items-start gap-2">
                      {!n.is_read && (
                        <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                      )}
                      <div className={!n.is_read ? "" : "pl-4"}>
                        <p className="text-xs font-semibold text-foreground leading-tight">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {href ? <Link to={href}>{Inner}</Link> : Inner}
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
