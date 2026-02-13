
CREATE TABLE public.episode_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  episode_id uuid NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, episode_id)
);

ALTER TABLE public.episode_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can count likes" ON public.episode_likes
  FOR SELECT USING (true);
CREATE POLICY "Auth users can insert own likes" ON public.episode_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can delete own likes" ON public.episode_likes
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.episode_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  episode_id uuid NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, episode_id)
);

ALTER TABLE public.episode_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can count favorites" ON public.episode_favorites
  FOR SELECT USING (true);
CREATE POLICY "Auth users can insert own favorites" ON public.episode_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can delete own favorites" ON public.episode_favorites
  FOR DELETE USING (auth.uid() = user_id);
