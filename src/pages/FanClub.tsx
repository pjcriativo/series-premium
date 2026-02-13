import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Heart, Users, Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const FanClub = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">Fã-Clube</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Junte-se à comunidade de fãs e tenha acesso exclusivo a conteúdos, bastidores e muito mais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Star, title: "Conteúdo Exclusivo", desc: "Acesse bastidores, making-of e episódios especiais antes de todo mundo." },
              { icon: Users, title: "Comunidade", desc: "Conecte-se com outros fãs, participe de discussões e enquetes." },
              { icon: MessageCircle, title: "Chat Direto", desc: "Interaja diretamente com criadores e elenco das séries." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6 text-center">
                <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to={user ? "/wallet" : "/auth"}>
              <Button size="lg" className="font-bold text-base px-8">
                {user ? "Participar do Fã-Clube" : "Entre para participar"}
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default FanClub;
