import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Eye, Users, Film, Tv, Coins, TrendingUp, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["admin-dashboard-metrics"],
    queryFn: async () => {
      const [
        profilesRes,
        seriesRes,
        episodesRes,
        viewsCountRes,
        viewsRes,
        transactionsRes,
        progressRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("series").select("id, title"),
        supabase.from("episodes").select("id", { count: "exact", head: true }),
        supabase.from("views").select("id", { count: "exact", head: true }),
        supabase.from("views").select("series_id").limit(1000),
        supabase.from("transactions").select("type, reason, coins"),
        supabase.from("user_progress").select("user_id, series_id, last_episode_number"),
      ]);

      const seriesMap = new Map<string, string>();
      (seriesRes.data ?? []).forEach((s) => seriesMap.set(s.id, s.title));

      // Views by series
      const viewsBySeries: Record<string, number> = {};
      (viewsRes.data ?? []).forEach((v) => {
        viewsBySeries[v.series_id] = (viewsBySeries[v.series_id] || 0) + 1;
      });
      const viewsBySeriesSorted = Object.entries(viewsBySeries)
        .map(([id, count]) => ({ id, title: seriesMap.get(id) ?? id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Transactions aggregation
      const txs = transactionsRes.data ?? [];
      const purchaseCredits = txs.filter((t) => t.type === "credit" && t.reason === "purchase");
      const coinsPurchased = purchaseCredits.reduce((s, t) => s + t.coins, 0);
      const purchaseCount = purchaseCredits.length;

      const episodeUnlockRevenue = txs
        .filter((t) => t.type === "debit" && t.reason === "episode_unlock")
        .reduce((s, t) => s + t.coins, 0);
      const seriesUnlockRevenue = txs
        .filter((t) => t.type === "debit" && t.reason === "series_unlock")
        .reduce((s, t) => s + t.coins, 0);

      // Retention
      const progressData = progressRes.data ?? [];
      const totalUsers = profilesRes.count ?? 0;
      const usersWithMultiple = new Set(
        progressData.filter((p) => p.last_episode_number > 1).map((p) => p.user_id)
      ).size;
      const retentionPct = totalUsers > 0 ? Math.round((usersWithMultiple / totalUsers) * 100) : 0;

      const progressBySeries: Record<string, number> = {};
      progressData.forEach((p) => {
        progressBySeries[p.series_id] = (progressBySeries[p.series_id] || 0) + 1;
      });
      const topResumed = Object.entries(progressBySeries)
        .map(([id, count]) => ({ id, title: seriesMap.get(id) ?? id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalViews: viewsCountRes.count ?? 0,
        totalUsers: totalUsers,
        totalSeries: seriesRes.data?.length ?? 0,
        totalEpisodes: episodesRes.count ?? 0,
        coinsPurchased,
        purchaseCount,
        episodeUnlockRevenue,
        seriesUnlockRevenue,
        viewsBySeriesSorted,
        retentionPct,
        topResumed,
      };
    },
  });

  const summaryCards = [
    { label: "Views Totais", value: metrics?.totalViews ?? 0, icon: Eye },
    { label: "Usuários", value: metrics?.totalUsers ?? 0, icon: Users },
    { label: "Séries", value: metrics?.totalSeries ?? 0, icon: Film },
    { label: "Episódios", value: metrics?.totalEpisodes ?? 0, icon: Tv },
    { label: "Moedas Compradas", value: metrics?.coinsPurchased ?? 0, icon: Coins },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando métricas…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{card.value.toLocaleString("pt-BR")}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Views por Série + Vendas */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5 text-primary" /> Views por Série
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(metrics?.viewsBySeriesSorted?.length ?? 0) > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics!.viewsBySeriesSorted} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="title" width={120} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip formatter={(v: number) => [v, "Visualizações"]} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma view registrada.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" /> Vendas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
              <span className="text-sm text-muted-foreground">Desbloqueios de Episódio</span>
              <span className="text-xl font-bold text-foreground">{(metrics?.episodeUnlockRevenue ?? 0).toLocaleString("pt-BR")} moedas</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
              <span className="text-sm text-muted-foreground">Desbloqueios de Série</span>
              <span className="text-xl font-bold text-foreground">{(metrics?.seriesUnlockRevenue ?? 0).toLocaleString("pt-BR")} moedas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compras de Moedas + Retenção */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Coins className="h-5 w-5 text-primary" /> Compras de Moedas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
              <span className="text-sm text-muted-foreground">Total de Moedas</span>
              <span className="text-xl font-bold text-foreground">{(metrics?.coinsPurchased ?? 0).toLocaleString("pt-BR")}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
              <span className="text-sm text-muted-foreground">Nº de Compras</span>
              <span className="text-xl font-bold text-foreground">{(metrics?.purchaseCount ?? 0).toLocaleString("pt-BR")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" /> Retenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Usuários com progresso &gt;1 episódio</span>
                <span className="font-bold text-foreground">{metrics?.retentionPct ?? 0}%</span>
              </div>
              <Progress value={metrics?.retentionPct ?? 0} className="h-3" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Séries Mais Retomadas</p>
              {(metrics?.topResumed?.length ?? 0) > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Série</TableHead>
                      <TableHead className="text-right">Usuários</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics!.topResumed.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.title}</TableCell>
                        <TableCell className="text-right">{s.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados de progresso.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
