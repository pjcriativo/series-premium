import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, ChevronsUpDown } from "lucide-react";

const formatDuration = (secs: number) => {
  if (!secs || secs <= 0) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

interface EpisodeFormData {
  series_id: string;
  title: string;
  episode_number: number;
  is_free: boolean;
  price_coins: number;
  duration_seconds: number;
  is_published: boolean;
  youtube_url: string;
}

const emptyForm: EpisodeFormData = {
  series_id: "",
  title: "",
  episode_number: 1,
  is_free: false,
  price_coins: 10,
  duration_seconds: 0,
  is_published: false,
  youtube_url: "",
};

const EpisodeForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState<EpisodeFormData>(emptyForm);
  const [seriesOpen, setSeriesOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);

  const { data: seriesList } = useQuery({
    queryKey: ["admin-series-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("id, title").order("title");
      if (error) throw error;
      return data;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: episode } = useQuery({
    queryKey: ["admin-episode-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("episodes").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (episode) {
      setForm({
        series_id: episode.series_id,
        title: episode.title,
        episode_number: episode.episode_number,
        is_free: episode.is_free,
        price_coins: episode.price_coins,
        duration_seconds: episode.duration_seconds ?? 0,
        is_published: episode.is_published,
        youtube_url: (episode as any).youtube_url ?? "",
      });
      setCurrentVideoUrl(episode.video_url);
    }
  }, [episode]);

  const uploadVideoWithProgress = async (file: File): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Não autenticado");

    return new Promise((resolve, reject) => {
      const path = `${crypto.randomUUID()}.mp4`;
      const url = `https://pnuydoujbrpfhohsxndz.supabase.co/storage/v1/object/videos/${path}`;
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve(path) : reject(new Error("Upload falhou")));
      xhr.onerror = () => reject(new Error("Upload falhou"));
      xhr.send(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Duplicate check
      const { data: existing } = await supabase
        .from("episodes")
        .select("id")
        .eq("series_id", form.series_id)
        .eq("episode_number", form.episode_number)
        .neq("id", id ?? "00000000-0000-0000-0000-000000000000")
        .maybeSingle();

      if (existing) {
        toast({ title: "Erro", description: "Já existe um episódio com esse número nesta série.", variant: "destructive" });
        setSaving(false);
        return;
      }

      let videoUrl: string | undefined;
      if (videoFile) {
        setUploadProgress(0);
        videoUrl = await uploadVideoWithProgress(videoFile);
        setUploadProgress(null);
      }

      const payload: any = { ...form };
      if (videoUrl) payload.video_url = videoUrl;

      if (isEdit) {
        const { error } = await supabase.from("episodes").update(payload).eq("id", id!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("episodes").insert(payload);
        if (error) throw error;
      }

      // Buscar o maior episode_number da série e atualizar total_episodes
      const { data: maxEpData } = await supabase
        .from("episodes")
        .select("episode_number")
        .eq("series_id", form.series_id)
        .order("episode_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxEpData) {
        await supabase
          .from("series")
          .update({ total_episodes: maxEpData.episode_number })
          .eq("id", form.series_id);
      }

      queryClient.invalidateQueries({ queryKey: ["admin-episodes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-series"] });
      queryClient.invalidateQueries({ queryKey: ["admin-series-list"] });
      toast({ title: isEdit ? "Episódio atualizado" : "Episódio criado" });
      navigate("/admin/episodes");
    } catch (err: any) {
      setUploadProgress(null);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/episodes">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{isEdit ? "Editar Episódio" : "Novo Episódio"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label>Série</Label>
          <Popover open={seriesOpen} onOpenChange={setSeriesOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={seriesOpen}
                className="w-full justify-between font-normal"
              >
                {form.series_id
                  ? seriesList?.find((s) => s.id === form.series_id)?.title
                  : "Selecione uma série"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar série..." />
                <CommandList>
                  <CommandEmpty>Nenhuma série encontrada.</CommandEmpty>
                  <CommandGroup>
                    {seriesList?.map((s) => (
                      <CommandItem
                        key={s.id}
                        value={s.title}
                        onSelect={() => {
                          setForm({ ...form, series_id: s.id });
                          setSeriesOpen(false);
                        }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${form.series_id === s.id ? "opacity-100" : "opacity-0"}`} />
                        {s.title}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Nº do episódio</Label>
            <Input type="number" value={form.episode_number} onChange={(e) => setForm({ ...form, episode_number: parseInt(e.target.value) || 1 })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Preço (moedas)</Label>
            <Input type="number" value={form.price_coins} onChange={(e) => setForm({ ...form, price_coins: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2">
            <Label>Duração (segundos)</Label>
            <div className="flex items-center gap-3">
              <Input type="number" value={form.duration_seconds} onChange={(e) => setForm({ ...form, duration_seconds: parseInt(e.target.value) || 0 })} />
              {formatDuration(form.duration_seconds) && (
                <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">{formatDuration(form.duration_seconds)}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Dica: 60 = 1 minuto · 600 = 10 minutos · 3600 = 1 hora</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>URL do YouTube (formato Reels/Shorts)</Label>
          <Input
            placeholder="https://www.youtube.com/watch?v=... ou https://youtube.com/shorts/..."
            value={form.youtube_url}
            onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Preencha a URL do YouTube <strong>ou</strong> faça upload do vídeo abaixo. A URL do YouTube tem prioridade.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Vídeo (.mp4)</Label>
          {currentVideoUrl && !videoFile && (
            <p className="text-sm text-muted-foreground">Vídeo atual: {currentVideoUrl}</p>
          )}
          <Input type="file" accept=".mp4,video/mp4" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
          {uploadProgress !== null && (
            <div className="space-y-1">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={form.is_free} onCheckedChange={(v) => setForm({ ...form, is_free: v })} />
            <Label>Gratuito</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
            <Label>Publicado</Label>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={saving || uploadProgress !== null}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </div>
  );
};

export default EpisodeForm;
