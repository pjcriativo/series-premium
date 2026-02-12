import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
  admin: "Dashboard",
  categories: "Categorias",
  series: "Séries",
  episodes: "Episódios",
  users: "Usuários",
  packages: "Pacotes de Moedas",
  banners: "Banners",
  new: "Novo",
  edit: "Editar",
};

const AdminBreadcrumb = () => {
  const { pathname } = useLocation();
  const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);

  // Build breadcrumb items: always start with "Admin"
  const crumbs: { label: string; path: string }[] = [];

  segments.forEach((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    // Skip UUID segments — show "Editar" instead
    if (/^[0-9a-f-]{36}$/.test(seg)) return;
    const label = routeLabels[seg] ?? seg;
    crumbs.push({ label, path });
  });

  // Don't render if only "Admin" (dashboard root)
  if (crumbs.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.path} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            {i === 0 && <Home className="h-3.5 w-3.5 mr-0.5" />}
            {isLast ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default AdminBreadcrumb;
