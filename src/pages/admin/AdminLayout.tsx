import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Film, Tv, Users, LogOut, Coins, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/categories", icon: FolderTree, label: "Categorias" },
  { to: "/admin/series", icon: Film, label: "Séries" },
  { to: "/admin/episodes", icon: Tv, label: "Episódios" },
  { to: "/admin/users", icon: Users, label: "Usuários" },
];

const AdminLayout = () => {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Coins className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Admin Panel</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-8"><Outlet /></main>
    </div>
  );
};

export default AdminLayout;
