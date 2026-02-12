
-- ============================================================
-- PHASE 1: DROP OLD TABLES & ENUMS
-- ============================================================

-- Drop tables in dependency order
DROP TABLE IF EXISTS public.user_progress CASCADE;
DROP TABLE IF EXISTS public.user_unlocks CASCADE;
DROP TABLE IF EXISTS public.coin_transactions CASCADE;
DROP TABLE IF EXISTS public.episodes CASCADE;
DROP TABLE IF EXISTS public.series CASCADE;

-- Drop old enum
DROP TYPE IF EXISTS public.series_status CASCADE;
DROP TYPE IF EXISTS public.coin_transaction_type CASCADE;

-- ============================================================
-- PHASE 2: MODIFY PROFILES
-- ============================================================

ALTER TABLE public.profiles DROP COLUMN IF EXISTS coin_balance;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auto_unlock boolean NOT NULL DEFAULT true;

-- ============================================================
-- PHASE 3: CREATE NEW ENUMS
-- ============================================================

CREATE TYPE public.transaction_type AS ENUM ('credit', 'debit');
CREATE TYPE public.transaction_reason AS ENUM ('purchase', 'episode_unlock', 'series_unlock', 'admin_adjust');

-- ============================================================
-- PHASE 4: CREATE NEW TABLES
-- ============================================================

-- categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- series
CREATE TABLE public.series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  synopsis text,
  cover_url text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  total_episodes int NOT NULL DEFAULT 0,
  free_episodes int NOT NULL DEFAULT 3,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

-- episodes
CREATE TABLE public.episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  episode_number int NOT NULL,
  title text NOT NULL,
  video_url text,
  duration_seconds int,
  is_free boolean NOT NULL DEFAULT false,
  price_coins int NOT NULL DEFAULT 10,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- wallets
CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- coin_packages
CREATE TABLE public.coin_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  coins int NOT NULL,
  price_cents int NOT NULL,
  stripe_price_id text,
  is_active boolean NOT NULL DEFAULT true
);
ALTER TABLE public.coin_packages ENABLE ROW LEVEL SECURITY;

-- transactions
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  reason public.transaction_reason NOT NULL,
  coins int NOT NULL,
  ref_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- episode_unlocks
CREATE TABLE public.episode_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id uuid NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, episode_id)
);
ALTER TABLE public.episode_unlocks ENABLE ROW LEVEL SECURITY;

-- series_unlocks
CREATE TABLE public.series_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, series_id)
);
ALTER TABLE public.series_unlocks ENABLE ROW LEVEL SECURITY;

-- user_progress
CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  last_episode_number int NOT NULL DEFAULT 1,
  last_position_seconds int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, series_id)
);
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- views
CREATE TABLE public.views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  episode_id uuid NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  watched_seconds int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PHASE 5: INDEXES
-- ============================================================

CREATE INDEX idx_series_category_id ON public.series(category_id);
CREATE INDEX idx_series_is_published ON public.series(is_published);
CREATE INDEX idx_episodes_series_id ON public.episodes(series_id);
CREATE INDEX idx_episodes_series_number ON public.episodes(series_id, episode_number);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_episode_unlocks_user_id ON public.episode_unlocks(user_id);
CREATE INDEX idx_episode_unlocks_episode_id ON public.episode_unlocks(episode_id);
CREATE INDEX idx_series_unlocks_user_id ON public.series_unlocks(user_id);
CREATE INDEX idx_series_unlocks_series_id ON public.series_unlocks(series_id);
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_series_id ON public.user_progress(series_id);
CREATE INDEX idx_views_user_id ON public.views(user_id);
CREATE INDEX idx_views_series_id ON public.views(series_id);
CREATE INDEX idx_views_episode_id ON public.views(episode_id);

-- ============================================================
-- PHASE 6: RLS POLICIES
-- ============================================================

-- profiles (keep existing + ensure admin read)
-- Already has: user reads own, user updates own, admin reads all
-- No changes needed

-- categories: public read, admin write
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- series: public read if published, admin full CRUD
CREATE POLICY "Anyone can view published series" ON public.series FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can view all series" ON public.series FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert series" ON public.series FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update series" ON public.series FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete series" ON public.series FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- episodes: public read if published series, admin full CRUD
CREATE POLICY "Anyone can view episodes of published series" ON public.episodes FOR SELECT 
  USING (is_published = true AND EXISTS (SELECT 1 FROM public.series WHERE series.id = episodes.series_id AND series.is_published = true));
CREATE POLICY "Admins can view all episodes" ON public.episodes FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert episodes" ON public.episodes FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update episodes" ON public.episodes FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete episodes" ON public.episodes FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- wallets: user reads own, admin reads all, no client writes
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- coin_packages: public read if active, admin write
CREATE POLICY "Anyone can view active packages" ON public.coin_packages FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all packages" ON public.coin_packages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert packages" ON public.coin_packages FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update packages" ON public.coin_packages FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete packages" ON public.coin_packages FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- transactions: user reads own, admin reads all
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- episode_unlocks: user reads own, user inserts own, admin reads all
CREATE POLICY "Users can view own episode unlocks" ON public.episode_unlocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own episode unlocks" ON public.episode_unlocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all episode unlocks" ON public.episode_unlocks FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- series_unlocks: user reads own, user inserts own, admin reads all
CREATE POLICY "Users can view own series unlocks" ON public.series_unlocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own series unlocks" ON public.series_unlocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all series unlocks" ON public.series_unlocks FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- user_progress: user reads/inserts/updates own
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- views: anyone can insert, admin reads all
CREATE POLICY "Anyone can insert views" ON public.views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all views" ON public.views FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- PHASE 7: UPDATE handle_new_user TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$;

-- ============================================================
-- PHASE 8: UPDATE TIMESTAMP TRIGGER FOR WALLETS & PROGRESS
-- ============================================================

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
