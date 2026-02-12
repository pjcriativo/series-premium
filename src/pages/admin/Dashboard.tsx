import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Film, Tv } from "lucide-react";

const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, series, episodes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("series").select("id", { count: "exact", head: true }),
        supabase.from("episodes").select("id", { count: "exact", head: true }),
      ]);
      return {
        users: profiles.count ?? 0,
        series: series.count ?? 0,
        episodes: episodes.count ?? 0,
      };
    },
  });

  const cards = [
    { label: "Usuários", value: stats?.users ?? 0, icon: Users },
    { label: "Séries", value: stats?.series ?? 0, icon: Film },
    { label: "Episódios", value: stats?.episodes ?? 0, icon: Tv },
  ];

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-foreground">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
