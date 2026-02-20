
-- Create series_follows table
CREATE TABLE public.series_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  series_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, series_id)
);

ALTER TABLE public.series_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own follows"
  ON public.series_follows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own follows"
  ON public.series_follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own follows"
  ON public.series_follows FOR DELETE
  USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  series_id uuid,
  episode_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);
