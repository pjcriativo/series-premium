
-- ============================================================
-- Fan Club: posts, reactions, comments
-- ============================================================

-- Posts (admin-only creation)
CREATE TABLE public.fan_club_posts (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    uuid    NOT NULL,
  title        text    NOT NULL,
  body         text    NOT NULL,
  image_url    text,
  post_type    text    NOT NULL DEFAULT 'post',  -- 'post' | 'behind_scenes' | 'bonus'
  is_published boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fan_club_posts ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can read published posts
CREATE POLICY "Logged in users can view published posts"
  ON public.fan_club_posts FOR SELECT
  USING (is_published = true AND auth.uid() IS NOT NULL);

-- Admins can view all posts
CREATE POLICY "Admins can view all fan club posts"
  ON public.fan_club_posts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert
CREATE POLICY "Admins can insert fan club posts"
  ON public.fan_club_posts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update
CREATE POLICY "Admins can update fan club posts"
  ON public.fan_club_posts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete
CREATE POLICY "Admins can delete fan club posts"
  ON public.fan_club_posts FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_fan_club_posts_updated_at
  BEFORE UPDATE ON public.fan_club_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- Reactions (❤️ like/unlike per post per user)
-- ============================================================
CREATE TABLE public.fan_club_reactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.fan_club_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.fan_club_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can count reactions"
  ON public.fan_club_reactions FOR SELECT
  USING (true);

CREATE POLICY "Auth users can insert own reaction"
  ON public.fan_club_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Auth users can delete own reaction"
  ON public.fan_club_reactions FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- Comments (moderation: admins can delete)
-- ============================================================
CREATE TABLE public.fan_club_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.fan_club_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL,
  body       text NOT NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fan_club_comments ENABLE ROW LEVEL SECURITY;

-- Logged-in users see non-deleted comments
CREATE POLICY "Logged in users can view comments"
  ON public.fan_club_comments FOR SELECT
  USING (is_deleted = false AND auth.uid() IS NOT NULL);

-- Admins see all (including deleted)
CREATE POLICY "Admins can view all comments"
  ON public.fan_club_comments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Auth users can insert own comments
CREATE POLICY "Auth users can insert own comments"
  ON public.fan_club_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can update (soft-delete)
CREATE POLICY "Admins can update comments"
  ON public.fan_club_comments FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can hard-delete comments
CREATE POLICY "Admins can delete comments"
  ON public.fan_club_comments FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can delete own comments
CREATE POLICY "Users can delete own comments"
  ON public.fan_club_comments FOR DELETE
  USING (auth.uid() = user_id);
