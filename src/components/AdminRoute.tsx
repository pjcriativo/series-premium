import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin, adminChecked } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  console.log("[ADMIN_ROUTE] loading=", loading, "adminChecked=", adminChecked, "user=", !!user, "isAdmin=", isAdmin, "timedOut=", timedOut);

  if (timedOut && (loading || !adminChecked)) {
    console.error("[ADMIN_ROUTE] timeout - loading nunca finalizou");
    return <Navigate to="/auth" replace />;
  }

  if (loading || !adminChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default AdminRoute;
