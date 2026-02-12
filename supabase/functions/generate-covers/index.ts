import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GENRE_STYLE: Record<string, string> = {
  romance: "warm golden tones, couple silhouettes, sunset or moonlight, passionate atmosphere",
  thriller: "dark moody tones, mysterious shadows, suspenseful fog, noir atmosphere",
  comédia: "bright vivid colors, playful composition, exaggerated comedic expressions, lighthearted",
  comedia: "bright vivid colors, playful composition, exaggerated comedic expressions, lighthearted",
  drama: "emotional cinematic lighting, intense gazes, dramatic shadows, deep contrast",
  ação: "explosive dynamic energy, high contrast, action poses, adrenaline rush",
  acao: "explosive dynamic energy, high contrast, action poses, adrenaline rush",
  fantasia: "magical ethereal glow, mythical creatures, enchanted landscapes, fantasy world",
  terror: "dark eerie haunting atmosphere, horror elements, creepy shadows, unsettling mood",
  "jovem adulto": "modern youthful vibrant colors, contemporary urban setting, energetic mood",
};

function getGenreStyle(categoryName: string | null): string {
  if (!categoryName) return "cinematic, dramatic lighting, moody atmosphere";
  const key = categoryName.toLowerCase().trim();
  return GENRE_STYLE[key] ?? "cinematic, dramatic lighting, moody atmosphere";
}

function buildSeriesPrompt(title: string, synopsis: string | null, category: string | null): string {
  const style = getGenreStyle(category);
  const synopsisText = synopsis ? ` Synopsis: ${synopsis}.` : "";
  return `Create a dramatic portrait book/movie cover image (2:3 aspect ratio, portrait orientation) for a ${category ?? "drama"} series titled '${title}'.${synopsisText} Style: ${style}. Ultra high resolution. IMPORTANT: Do NOT include any text, letters, words, or typography on the image.`;
}

function buildBannerPrompt(title: string, subtitle: string | null): string {
  return `Create a wide cinematic landscape banner image (21:9 ultra-wide aspect ratio) for a streaming platform featuring the series '${title}'. ${subtitle ? `Tagline: ${subtitle}.` : ""} Style: epic cinematic composition, dramatic lighting, rich colors, movie poster quality. Ultra high resolution. IMPORTANT: Do NOT include any text, letters, words, or typography on the image.`;
}

async function generateImage(prompt: string, apiKey: string): Promise<Uint8Array> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI gateway error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl) throw new Error("No image returned from AI gateway");

  const base64 = imageUrl.replace(/^data:image\/\w+;base64,/, "");
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    // Use service role client for DB operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check admin role
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const type = body.type ?? "covers"; // "covers" or "banners"
    const seriesId = body.series_id ?? null;

    const results: Array<{ id: string; title: string; status: string }> = [];

    if (type === "banners") {
      const { data: banners, error } = await supabase.from("banners").select("*").order("sort_order");
      if (error) throw error;

      for (const banner of banners ?? []) {
        try {
          console.log(`Generating banner for: ${banner.title}`);
          const prompt = buildBannerPrompt(banner.title, banner.subtitle);
          const imageBytes = await generateImage(prompt, LOVABLE_API_KEY);

          const filePath = `banners/${banner.id}.png`;
          const { error: uploadError } = await supabase.storage
            .from("covers")
            .upload(filePath, imageBytes, { contentType: "image/png", upsert: true });
          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage.from("covers").getPublicUrl(filePath);

          const { error: updateError } = await supabase
            .from("banners")
            .update({ image_url: publicUrlData.publicUrl })
            .eq("id", banner.id);
          if (updateError) throw updateError;

          results.push({ id: banner.id, title: banner.title, status: "ok" });
        } catch (e) {
          console.error(`Failed banner ${banner.title}:`, e);
          results.push({ id: banner.id, title: banner.title, status: `error: ${e.message}` });
        }
        await delay(3000);
      }
    } else {
      let query = supabase.from("series").select("*, categories(name)");
      if (seriesId) query = query.eq("id", seriesId);
      else query = query.order("created_at", { ascending: false });

      const { data: seriesList, error } = await query;
      if (error) throw error;

      for (const series of seriesList ?? []) {
        try {
          console.log(`Generating cover for: ${series.title}`);
          const categoryName = (series as any).categories?.name ?? null;
          const prompt = buildSeriesPrompt(series.title, series.synopsis, categoryName);
          const imageBytes = await generateImage(prompt, LOVABLE_API_KEY);

          const filePath = `${series.id}.png`;
          const { error: uploadError } = await supabase.storage
            .from("covers")
            .upload(filePath, imageBytes, { contentType: "image/png", upsert: true });
          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage.from("covers").getPublicUrl(filePath);

          const { error: updateError } = await supabase
            .from("series")
            .update({ cover_url: publicUrlData.publicUrl })
            .eq("id", series.id);
          if (updateError) throw updateError;

          results.push({ id: series.id, title: series.title, status: "ok" });
        } catch (e) {
          console.error(`Failed series ${series.title}:`, e);
          results.push({ id: series.id, title: series.title, status: `error: ${e.message}` });
        }
        await delay(3000);
      }
    }

    return new Response(JSON.stringify({ type, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-covers error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
