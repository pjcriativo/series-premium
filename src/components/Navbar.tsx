import { Link } from "react-router-dom";
import { Search, User, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border">
      <Link to="/" className="text-xl font-black tracking-tight text-primary">
        ReelShort
      </Link>

      <div className="flex items-center gap-2">
        <Link to="/search">
          <Button variant="ghost" size="icon" className="text-foreground">
            <Search className="h-5 w-5" />
          </Button>
        </Link>

        {user ? (
          <Link to="/admin">
            <Avatar className="h-8 w-8 border border-primary/50">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {user.email?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Link to="/auth">
            <Button variant="ghost" size="icon" className="text-foreground">
              <LogIn className="h-5 w-5" />
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
