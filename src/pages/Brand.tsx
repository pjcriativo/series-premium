import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Sparkles, TrendingUp, Eye, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const Brand = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">Marca & Parcerias</h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Alcance milhões de espectadores engajados com conteúdo nativo integrado às nossas séries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Eye, title: "Audiência Engajada", desc: "Nossos espectadores assistem em média 8 episódios por sessão com alta retenção." },
              { icon: TrendingUp, title: "Crescimento Rápido", desc: "Plataforma em expansão com milhares de novos usuários mensais." },
              { icon: Sparkles, title: "Brand Content", desc: "Integração natural da sua marca dentro das narrativas das séries." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6 text-center">
                <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
          <Button size="lg" className="font-bold text-base px-8 gap-2" onClick={() => window.location.href = "mailto:contato@epsodiox.com"}>
              <Mail className="h-5 w-5" />
              Fale Conosco
            </Button>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Brand;
