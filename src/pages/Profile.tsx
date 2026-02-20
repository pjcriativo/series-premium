import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { getSeriesCover } from "@/lib/demo-covers";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { WalletCard } from "@/components/profile/WalletCard";
import { CreditPackages } from "@/components/profile/CreditPackages";
import { TransactionHistory } from "@/components/profile/TransactionHistory";

const Profile = () => {
  const { user, profile, signOut, isAdmin, refreshProfile } = useAuth();
  const packagesRef = useRef<HTMLDivElement>(null);

  const scrollToPackages = () => {
    packagesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Extended profile (includes phone + bio)
  const { data: extProfile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["ext-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, auto_unlock, phone, bio")
        .eq("id", user!.id)
        .single();
      return data as {
        id: string;
        display_name: string | null;
        avatar_url: string | null;
        auto_unlock: boolean;
        phone: string | null;
        bio: string | null;
      } | null;
    },
    enabled: !!user,
  });

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("wallets")
        .select("balance, updated_at")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data as {
        id: string;
        type: "credit" | "debit";
        reason: string;
        coins: number;
        created_at: string;
      }[];
    },
    enabled: !!user,
  });

  // Continue watching
  const { data: progressList } = useQuery({
    queryKey: ["user-progress-all", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("series_id, last_episode_number, last_position_seconds, updated_at")
        .order("updated_at", { ascending: false });
      return data;
    },
    enabled: !!user,
  });

  const seriesIds = progressList?.map((p) => p.series_id) ?? [];

  const { data: watchedSeries } = useQuery({
    queryKey: ["watched-series", seriesIds],
    queryFn: async () => {
      const { data } = await supabase
        .from("series")
        .select("id, title, cover_url, total_episodes")
        .in("id", seriesIds);
      return data;
    },
    enabled: seriesIds.length > 0,
  });

  const { data: continueEpisodes } = useQuery({
    queryKey: ["continue-episodes", progressList?.map((p) => `${p.series_id}-${p.last_episode_number}`)],
    queryFn: async () => {
      const promises = progressList!.map((p) =>
        supabase
          .from("episodes")
          .select("id, title, episode_number, series_id, duration_seconds")
          .eq("series_id", p.series_id)
          .eq("episode_number", p.last_episode_number)
          .maybeSingle()
      );
      const results = await Promise.all(promises);
      return results.map((r) => r.data).filter(Boolean);
    },
    enabled: !!progressList?.length,
  });

  const handleAutoUnlockToggle = async (checked: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ auto_unlock: checked })
      .eq("id", user!.id);
    if (error) {
      toast.error("Erro ao atualizar preferência");
    } else {
      await refreshProfile();
      toast.success(checked ? "Auto-desbloqueio ativado" : "Auto-desbloqueio desativado");
    }
  };

  const seriesMap = new Map(watchedSeries?.map((s) => [s.id, s]) ?? []);
  const progressMap = new Map(
    progressList?.map((p) => [p.series_id, p.last_position_seconds]) ?? []
  );

  const isPageLoading = profileLoading || walletLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-14 pb-24 px-4 max-w-lg mx-auto">
        {/* Header skeleton */}
        {isPageLoading ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-8 w-40 rounded" />
          </div>
        ) : (
          <ProfileHeader
            displayName={extProfile?.display_name ?? profile?.display_name ?? null}
            email={user?.email}
            avatarUrl={extProfile?.avatar_url ?? profile?.avatar_url ?? null}
            balance={wallet?.balance ?? 0}
            isAdmin={isAdmin}
            onBuyCredits={scrollToPackages}
          />
        )}

        <div className="space-y-5">
          {/* Wallet card */}
          {walletLoading ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : (
            <WalletCard
              balance={wallet?.balance ?? 0}
              updatedAt={wallet?.updated_at}
              onAddCredits={scrollToPackages}
            />
          )}

          {/* Edit profile form */}
          {profileLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : extProfile ? (
            <EditProfileForm
              userId={user!.id}
              initialName={extProfile.display_name}
              initialPhone={extProfile.phone}
              initialBio={extProfile.bio}
              initialAvatarUrl={extProfile.avatar_url}
              onSaved={async () => {
                await refetchProfile();
                await refreshProfile();
              }}
            />
          ) : null}

          {/* Auto-unlock toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Auto-desbloqueio</p>
              <p className="text-xs text-muted-foreground">
                Desbloquear episódios automaticamente ao assistir
              </p>
            </div>
            <Switch
              checked={extProfile?.auto_unlock ?? profile?.auto_unlock ?? true}
              onCheckedChange={handleAutoUnlockToggle}
            />
          </div>

          {/* Continue watching */}
          {continueEpisodes && continueEpisodes.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">Continuar Assistindo</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
                {continueEpisodes.map((ep) => {
                  const series = seriesMap.get(ep.series_id);
                  if (!series) return null;
                  const cover = getSeriesCover(series.id, series.cover_url);
                  const pos = progressMap.get(ep.series_id) ?? 0;
                  const dur = (ep as { duration_seconds?: number }).duration_seconds;
                  const pct = dur && dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;
                  return (
                    <Link key={ep.id} to={`/watch/${ep.id}`} className="group flex-shrink-0 w-32 snap-start">
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-1.5">
                        {cover ? (
                          <img src={cover} alt={series.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary">
                            <span className="text-muted-foreground text-2xl font-bold">{series.title.charAt(0)}</span>
                          </div>
                        )}
                        <Badge className="absolute bottom-2 left-2 text-[10px]">Ep. {ep.episode_number}</Badge>
                      </div>
                      {pct > 0 && (
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-1">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      <p className="text-xs font-medium text-foreground truncate">{series.title}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Watched series */}
          {watchedSeries && watchedSeries.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">Séries Assistidas</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
                {watchedSeries.map((series) => {
                  const cover = getSeriesCover(series.id, series.cover_url);
                  return (
                    <Link key={series.id} to={`/series/${series.id}`} className="group flex-shrink-0 w-32 snap-start">
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-1.5">
                        {cover ? (
                          <img src={cover} alt={series.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary">
                            <span className="text-muted-foreground text-2xl font-bold">{series.title.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-foreground truncate">{series.title}</p>
                      <p className="text-[10px] text-muted-foreground">{series.total_episodes} ep.</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <Separator />

          {/* Credit packages */}
          <div ref={packagesRef}>
            {user && <CreditPackages userId={user.id} />}
          </div>

          <Separator />

          {/* Transaction history */}
          <TransactionHistory transactions={transactions} isLoading={txLoading} />

          <Separator />

          {/* Sign out */}
          <Button
            variant="ghost"
            className="w-full text-muted-foreground gap-2"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" /> Sair da conta
          </Button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Profile;
