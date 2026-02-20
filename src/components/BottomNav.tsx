import { Home, Search, Coins, User, Clapperboard, Bell } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const tabs = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/reels", icon: Clapperboard, label: "Reels" },
  { to: "/search", icon: Search, label: "Buscar" },
  { to: "/wallet", icon: Coins, label: "Carteira", auth: true },
  { to: "/me", icon: User, label: "Perfil", auth: true },
];

const BottomNav = () => {
  const { user } = useAuth();

  const { data: unreadCount } = useQuery({
    queryKey: ["notifications-unread-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const visibleTabs = tabs.filter((t) => !t.auth || user);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-black/60 backdrop-blur-md py-2 md:hidden">
      {visibleTabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )
          }
        >
          <tab.icon className="h-5 w-5" />
          {tab.label}
        </NavLink>
      ))}

      {/* Notification bell — only for logged-in users, mobile */}
      {user && (
        <NavLink
          to="/me"
          className={({ isActive }) =>
            cn(
              "relative flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )
          }
        >
          <div className="relative">
            <Bell className="h-5 w-5" />
            {(unreadCount ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {(unreadCount ?? 0) > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          Alertas
        </NavLink>
      )}
    </nav>
  );
};

export default BottomNav;
