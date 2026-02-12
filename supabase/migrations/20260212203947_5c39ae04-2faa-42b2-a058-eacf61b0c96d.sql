
-- Create banners table
CREATE TABLE public.banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  subtitle text,
  image_url text,
  link_series_id uuid REFERENCES public.series(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active banners" ON public.banners
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all banners" ON public.banners
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert banners" ON public.banners
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update banners" ON public.banners
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete banners" ON public.banners
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed categories (use ON CONFLICT to avoid duplicates if some exist)
INSERT INTO public.categories (id, name, slug) VALUES
  ('c0000001-0000-4000-8000-000000000001', 'Romance', 'romance'),
  ('c0000001-0000-4000-8000-000000000002', 'Thriller', 'thriller'),
  ('c0000001-0000-4000-8000-000000000003', 'Comédia', 'comedia'),
  ('c0000001-0000-4000-8000-000000000004', 'Drama', 'drama'),
  ('c0000001-0000-4000-8000-000000000005', 'Ação', 'acao'),
  ('c0000001-0000-4000-8000-000000000006', 'Fantasia', 'fantasia'),
  ('c0000001-0000-4000-8000-000000000007', 'Terror', 'terror'),
  ('c0000001-0000-4000-8000-000000000008', 'Jovem Adulto', 'jovem-adulto')
ON CONFLICT (id) DO NOTHING;

-- Seed demo series (~3 per category)
INSERT INTO public.series (id, title, slug, synopsis, category_id, is_published, free_episodes, total_episodes) VALUES
  -- Romance
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Amor em Chamas', 'amor-em-chamas', 'Dois corações em conflito descobrem que o destino tem outros planos.', 'c0000001-0000-4000-8000-000000000001', true, 2, 12),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Corações Cruzados', 'coracoes-cruzados', 'Um reencontro inesperado reacende uma paixão que nunca morreu.', 'c0000001-0000-4000-8000-000000000001', true, 2, 10),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Promessas ao Luar', 'promessas-ao-luar', 'Sob a luz da lua, segredos e juras de amor se entrelaçam.', 'c0000001-0000-4000-8000-000000000001', true, 2, 8),
  -- Thriller
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Sombras do Passado', 'sombras-do-passado', 'Um detetive persegue fantasmas que não querem ser esquecidos.', 'c0000001-0000-4000-8000-000000000002', true, 2, 10),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'O Último Segredo', 'o-ultimo-segredo', 'Cada pista revela uma mentira mais profunda.', 'c0000001-0000-4000-8000-000000000002', true, 2, 8),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'Zona de Risco', 'zona-de-risco', 'Quando a verdade é mais perigosa que a mentira.', 'c0000001-0000-4000-8000-000000000002', true, 2, 12),
  -- Comédia
  ('a1b2c3d4-0007-4000-8000-000000000007', 'Confusões em Família', 'confusoes-em-familia', 'Uma família disfuncional tentando sobreviver junta... e falhando hilariantemente.', 'c0000001-0000-4000-8000-000000000003', true, 2, 10),
  ('a1b2c3d4-0008-4000-8000-000000000008', 'Plantão Maluco', 'plantao-maluco', 'O hospital mais caótico do Brasil onde tudo pode acontecer.', 'c0000001-0000-4000-8000-000000000003', true, 2, 8),
  ('a1b2c3d4-0009-4000-8000-000000000009', 'Vizinhos Impossíveis', 'vizinhos-impossiveis', 'Dois vizinhos rivais que não conseguem viver um sem o outro.', 'c0000001-0000-4000-8000-000000000003', true, 2, 10),
  -- Drama
  ('a1b2c3d4-0010-4000-8000-000000000010', 'Além do Horizonte', 'alem-do-horizonte', 'Uma jornada de superação que testa os limites da esperança.', 'c0000001-0000-4000-8000-000000000004', true, 2, 12),
  ('a1b2c3d4-0011-4000-8000-000000000011', 'Laços de Sangue', 'lacos-de-sangue', 'Segredos de família que podem destruir gerações inteiras.', 'c0000001-0000-4000-8000-000000000004', true, 2, 10),
  ('a1b2c3d4-0012-4000-8000-000000000012', 'A Última Chance', 'a-ultima-chance', 'Quando não há mais nada a perder, tudo pode mudar.', 'c0000001-0000-4000-8000-000000000004', true, 2, 8),
  -- Ação
  ('a1b2c3d4-0013-4000-8000-000000000013', 'Operação Resgate', 'operacao-resgate', 'Uma equipe de elite em missões impossíveis ao redor do mundo.', 'c0000001-0000-4000-8000-000000000005', true, 2, 10),
  ('a1b2c3d4-0014-4000-8000-000000000014', 'Fogo Cruzado', 'fogo-cruzado', 'Nas ruas da cidade, a lei é apenas uma sugestão.', 'c0000001-0000-4000-8000-000000000005', true, 2, 12),
  ('a1b2c3d4-0015-4000-8000-000000000015', 'Caçadores de Elite', 'cacadores-de-elite', 'Mercenários com honra num mundo sem regras.', 'c0000001-0000-4000-8000-000000000005', true, 2, 8),
  -- Fantasia
  ('a1b2c3d4-0016-4000-8000-000000000016', 'Reinos Perdidos', 'reinos-perdidos', 'Um portal entre mundos revela poderes adormecidos.', 'c0000001-0000-4000-8000-000000000006', true, 2, 12),
  ('a1b2c3d4-0017-4000-8000-000000000017', 'A Profecia do Dragão', 'a-profecia-do-dragao', 'O último dragão desperta e com ele o destino de um reino.', 'c0000001-0000-4000-8000-000000000006', true, 2, 10),
  -- Terror
  ('a1b2c3d4-0018-4000-8000-000000000018', 'A Casa no Fim da Rua', 'a-casa-no-fim-da-rua', 'Ninguém entra. Ninguém sai. Ninguém esquece.', 'c0000001-0000-4000-8000-000000000007', true, 2, 8),
  ('a1b2c3d4-0019-4000-8000-000000000019', 'Sussurros na Escuridão', 'sussurros-na-escuridao', 'Alguns sons não deviam ser ouvidos.', 'c0000001-0000-4000-8000-000000000007', true, 2, 10),
  -- Jovem Adulto
  ('a1b2c3d4-0020-4000-8000-000000000020', 'Geração Z', 'geracao-z', 'Amizade, amor e pressão social na era digital.', 'c0000001-0000-4000-8000-000000000008', true, 2, 10),
  ('a1b2c3d4-0021-4000-8000-000000000021', 'Último Ano', 'ultimo-ano', 'O ano que muda tudo: amizades, amores e o futuro.', 'c0000001-0000-4000-8000-000000000008', true, 2, 12)
ON CONFLICT (id) DO NOTHING;

-- Seed banners
INSERT INTO public.banners (id, title, subtitle, link_series_id, sort_order, is_active) VALUES
  ('b0000001-0000-4000-8000-000000000001', 'Amor em Chamas', 'A série mais assistida da semana 🔥', 'a1b2c3d4-0001-4000-8000-000000000001', 1, true),
  ('b0000001-0000-4000-8000-000000000002', 'Sombras do Passado', 'Mistério e suspense que vai te prender', 'a1b2c3d4-0004-4000-8000-000000000004', 2, true),
  ('b0000001-0000-4000-8000-000000000003', 'Confusões em Família', 'Prepare-se para rir muito!', 'a1b2c3d4-0007-4000-8000-000000000007', 3, true)
ON CONFLICT (id) DO NOTHING;
