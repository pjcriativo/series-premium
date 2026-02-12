import { Home, Search, Coins, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const tabs = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/search", icon: Search, label: "Buscar" },
  { to: "/wallet", icon: Coins, label: "Carteira", auth: true },
  { to: "/me", icon: User, label: "Perfil", auth: true },
];

const BottomNav = () => {
  const { user } = useAuth();

  const visibleTabs = tabs.filter((t) => !t.auth || user);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur-md py-2 md:hidden">
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
    </nav>
  );
};

export default BottomNav;
