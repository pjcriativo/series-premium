import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { LayoutDashboard, Film, Tv, Users, LogOut, Coins, FolderTree, Menu, Image, UserCircle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/categories", icon: FolderTree, label: "Categorias" },
  { to: "/admin/series", icon: Film, label: "Séries" },
  { to: "/admin/episodes", icon: Tv, label: "Episódios" },
  { to: "/admin/users", icon: Users, label: "Usuários" },
  { to: "/admin/packages", icon: Coins, label: "Pacotes de Moedas" },
  { to: "/admin/banners", icon: Image, label: "Banners" },
  { to: "/me", icon: UserCircle, label: "Meu Perfil" },
  { to: "/", icon: Globe, label: "Ver Site" },
];

const NavItems = ({ onItemClick }: { onItemClick?: () => void }) => (
  <>
    {navItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={onItemClick}
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
  </>
);

const AdminLayout = () => {
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-card px-4">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-14 items-center gap-2 border-b border-border px-6">
                <Coins className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold text-foreground">Admin</span>
              </div>
              <nav className="flex-1 space-y-1 p-4">
                <NavItems onItemClick={() => setDrawerOpen(false)} />
              </nav>
              <div className="border-t border-border p-4">
                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={signOut}>
                  <LogOut className="h-4 w-4" /> Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-lg font-bold text-foreground">Admin Panel</span>
        </header>
        <main className="p-4"><Outlet /></main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Coins className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Admin Panel</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <NavItems />
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
