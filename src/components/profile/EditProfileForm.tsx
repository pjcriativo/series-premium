import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditProfileFormProps {
  userId: string;
  initialName: string | null;
  initialPhone: string | null;
  initialBio: string | null;
  initialAvatarUrl: string | null;
  onSaved: () => void;
}

export const EditProfileForm = ({
  userId,
  initialName,
  initialPhone,
  initialBio,
  initialAvatarUrl,
  onSaved,
}: EditProfileFormProps) => {
  const [name, setName] = useState(initialName ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [bio, setBio] = useState(initialBio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("covers").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      toast.success("Foto atualizada!");
    } catch (err: unknown) {
      toast.error("Erro ao enviar imagem");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("O nome não pode estar vazio");
      return;
    }
    if (phone.length > 20) {
      toast.error("Telefone muito longo (máx. 20 caracteres)");
      return;
    }
    if (bio.length > 300) {
      toast.error("Bio muito longa (máx. 300 caracteres)");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: name.trim(),
          phone: phone.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl || null,
        })
        .eq("id", userId);
      if (error) throw error;
      toast.success("Perfil salvo com sucesso!");
      onSaved();
    } catch (err: unknown) {
      toast.error("Erro ao salvar perfil");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const initials = name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <div className="space-y-4 p-5 bg-card border border-border rounded-xl">
      <h2 className="text-base font-semibold text-foreground">Editar Perfil</h2>

      {/* Avatar picker */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-16 w-16 border-2 border-border">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="avatar" />}
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Camera className="h-3 w-3" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Foto de perfil</p>
          <p className="text-xs text-muted-foreground">JPG, PNG ou WebP · máx. 5MB</p>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="profile-name" className="text-sm">
            Nome completo <span className="text-destructive">*</span>
          </Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            maxLength={100}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profile-phone" className="text-sm">
            Telefone
          </Label>
          <Input
            id="profile-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+55 11 99999-9999"
            maxLength={20}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profile-bio" className="text-sm">
            Bio{" "}
            <span className="text-muted-foreground text-xs">({bio.length}/300)</span>
          </Label>
          <Textarea
            id="profile-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Fale um pouco sobre você…"
            maxLength={300}
            rows={3}
          />
        </div>
      </div>

      <Button
        className="w-full gap-2"
        onClick={handleSave}
        disabled={saving || uploading}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saving ? "Salvando…" : "Salvar alterações"}
      </Button>
    </div>
  );
};
