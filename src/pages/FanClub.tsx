import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, ChevronDown, ChevronUp, Send, Trash2, Clapperboard, Star, Newspaper, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── helpers ──────────────────────────────────────────────────────────────────

const POST_TYPE_LABELS: Record<string, { label: string; Icon: React.ElementType }> = {
  post:           { label: "Post",          Icon: Newspaper   },
  behind_scenes:  { label: "Bastidores",    Icon: Clapperboard },
  bonus:          { label: "Bônus",         Icon: Star         },
};

function formatDate(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR });
}

// ── Comment section ───────────────────────────────────────────────────────────

const CommentSection = ({ postId, isAdmin }: { postId: string; isAdmin: boolean }) => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [open, setOpen] = useState(false);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["fan-club-comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fan_club_comments")
        .select("id, body, created_at, user_id, is_deleted, profiles:user_id(display_name, avatar_url)")
        .eq("post_id", postId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  const addComment = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase.from("fan_club_comments").insert({
        post_id: postId,
        user_id: user!.id,
        body: text,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["fan-club-comments", postId] });
    },
    onError: () => toast({ title: "Erro ao comentar", variant: "destructive" }),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("fan_club_comments")
        .update({ is_deleted: true })
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fan-club-comments", postId] }),
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Comentários
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground">Seja o primeiro a comentar!</p>
          ) : (
            comments.map((c: any) => (
              <div key={c.id} className="flex gap-2 group">
                <div className="flex-1 bg-secondary/40 rounded-lg px-3 py-2">
                  <span className="text-xs font-semibold text-foreground">
                    {c.profiles?.display_name ?? "Usuário"}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">{formatDate(c.created_at)}</span>
                  <p className="text-sm text-foreground mt-0.5">{c.body}</p>
                </div>
                {(isAdmin || c.user_id === user?.id) && (
                  <button
                    onClick={() => deleteComment.mutate(c.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}

          {user ? (
            <div className="flex gap-2 mt-2">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escreva um comentário…"
                className="min-h-[60px] text-sm resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && body.trim()) {
                    e.preventDefault();
                    addComment.mutate(body.trim());
                  }
                }}
              />
              <Button
                size="icon"
                disabled={!body.trim() || addComment.isPending}
                onClick={() => addComment.mutate(body.trim())}
                className="shrink-0 self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link to="/auth" className="text-xs text-primary hover:underline">
              Entre para comentar
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

// ── Post card ─────────────────────────────────────────────────────────────────

const PostCard = ({ post, isAdmin }: { post: any; isAdmin: boolean }) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { label, Icon } = POST_TYPE_LABELS[post.post_type] ?? POST_TYPE_LABELS.post;

  const { data: reactionData } = useQuery({
    queryKey: ["fan-club-reactions", post.id, user?.id],
    queryFn: async () => {
      const [{ count }, myReaction] = await Promise.all([
        supabase.from("fan_club_reactions").select("id", { count: "exact", head: true }).eq("post_id", post.id),
        user
          ? supabase.from("fan_club_reactions").select("id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      return { total: count ?? 0, hasLiked: !!myReaction.data };
    },
  });

  const toggleReaction = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (reactionData?.hasLiked) {
        await supabase.from("fan_club_reactions").delete().eq("post_id", post.id).eq("user_id", user.id);
      } else {
        await supabase.from("fan_club_reactions").insert({ post_id: post.id, user_id: user.id });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fan-club-reactions", post.id, user?.id] }),
    onError: () => toast({ title: "Erro ao reagir", variant: "destructive" }),
  });

  return (
    <article className="rounded-xl border border-border bg-card overflow-hidden">
      {post.image_url && (
        <img src={post.image_url} alt={post.title} className="w-full object-cover max-h-72" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="flex items-center gap-1 text-xs px-2 py-0.5">
            <Icon className="h-3 w-3" />
            {label}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">{formatDate(post.created_at)}</span>
        </div>
        <h2 className="text-base font-bold text-foreground leading-snug mb-1">{post.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{post.body}</p>

        {/* Reaction row */}
        <div className="flex items-center gap-3 mt-3">
          {user ? (
            <button
              onClick={() => toggleReaction.mutate()}
              disabled={toggleReaction.isPending}
              className={cn(
                "flex items-center gap-1.5 text-sm transition-colors",
                reactionData?.hasLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
              )}
            >
              <Heart className={cn("h-4 w-4", reactionData?.hasLiked && "fill-current")} />
              {reactionData?.total ?? 0}
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Heart className="h-4 w-4" />
              {reactionData?.total ?? 0}
            </span>
          )}
        </div>

        <CommentSection postId={post.id} isAdmin={isAdmin} />
      </div>
    </article>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const POST_TYPE_FILTERS = [
  { value: "all",           label: "Todos"       },
  { value: "post",          label: "Posts"       },
  { value: "behind_scenes", label: "Bastidores"  },
  { value: "bonus",         label: "Bônus"       },
];

const FanClub = () => {
  const { user, profile } = useAuth();
  const [filter, setFilter] = useState("all");

  // Check admin role
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["fan-club-posts", filter],
    queryFn: async () => {
      let q = supabase
        .from("fan_club_posts")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("post_type", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20 pb-20 px-4 flex items-center justify-center">
          <div className="text-center max-w-sm space-y-5">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/20">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-foreground">Fã-Clube Exclusivo</h1>
            <p className="text-muted-foreground">
              Entre com sua conta para acessar posts exclusivos, bastidores e episódios bônus da comunidade.
            </p>
            <Link to="/auth">
              <Button size="lg" className="w-full font-bold">Entrar / Criar conta</Button>
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-20 px-4 md:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pt-2">
            <div>
              <h1 className="text-2xl font-black text-foreground">Fã-Clube</h1>
              <p className="text-sm text-muted-foreground">Conteúdo exclusivo para membros</p>
            </div>
            {isAdmin && (
              <Link to="/admin/fan-club">
                <Button variant="outline" size="sm">Gerenciar Posts</Button>
              </Link>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
            {POST_TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  filter === f.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Posts feed */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Nenhum post publicado ainda. Volte em breve!</p>
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post: any) => (
                <PostCard key={post.id} post={post} isAdmin={!!isAdmin} />
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default FanClub;
