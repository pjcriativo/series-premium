
-- Seed Data: 3 demo series with 5 episodes each

-- Series 1: Romance (featured)
INSERT INTO public.series (id, title, description, genre, status, featured, total_coin_price, cover_url)
VALUES (
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Amor em Chamas',
  'Uma história de amor proibido que desafia todas as convenções. Quando dois mundos colidem, nada será como antes.',
  'Romance',
  'published',
  true,
  40,
  NULL
);

-- Series 2: Thriller
INSERT INTO public.series (id, title, description, genre, status, featured, total_coin_price, cover_url)
VALUES (
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Sombras do Passado',
  'Um detetive aposentado é forçado a revisitar o caso que destruiu sua carreira. Cada pista revela uma verdade mais sombria.',
  'Thriller',
  'published',
  false,
  40,
  NULL
);

-- Series 3: Comedy
INSERT INTO public.series (id, title, description, genre, status, featured, total_coin_price, cover_url)
VALUES (
  'a1b2c3d4-0003-4000-8000-000000000003',
  'Confusões em Família',
  'Uma família caótica tenta organizar o casamento do século, mas nada sai como planejado. Prepare-se para rir!',
  'Comédia',
  'published',
  false,
  40,
  NULL
);

-- Episodes for Series 1: Amor em Chamas
INSERT INTO public.episodes (series_id, title, episode_number, is_free, coin_cost, duration_seconds) VALUES
('a1b2c3d4-0001-4000-8000-000000000001', 'O Encontro', 1, true, 0, 180),
('a1b2c3d4-0001-4000-8000-000000000001', 'Segredos Revelados', 2, false, 5, 210),
('a1b2c3d4-0001-4000-8000-000000000001', 'A Escolha', 3, false, 10, 195),
('a1b2c3d4-0001-4000-8000-000000000001', 'Corações Partidos', 4, false, 10, 240),
('a1b2c3d4-0001-4000-8000-000000000001', 'O Final', 5, false, 15, 300);

-- Episodes for Series 2: Sombras do Passado
INSERT INTO public.episodes (series_id, title, episode_number, is_free, coin_cost, duration_seconds) VALUES
('a1b2c3d4-0002-4000-8000-000000000002', 'O Caso Frio', 1, true, 0, 200),
('a1b2c3d4-0002-4000-8000-000000000002', 'Pistas Falsas', 2, false, 5, 220),
('a1b2c3d4-0002-4000-8000-000000000002', 'A Testemunha', 3, false, 10, 190),
('a1b2c3d4-0002-4000-8000-000000000002', 'Traição', 4, false, 10, 250),
('a1b2c3d4-0002-4000-8000-000000000002', 'Justiça', 5, false, 15, 280);

-- Episodes for Series 3: Confusões em Família
INSERT INTO public.episodes (series_id, title, episode_number, is_free, coin_cost, duration_seconds) VALUES
('a1b2c3d4-0003-4000-8000-000000000003', 'O Convite', 1, true, 0, 160),
('a1b2c3d4-0003-4000-8000-000000000003', 'O Vestido', 2, false, 5, 175),
('a1b2c3d4-0003-4000-8000-000000000003', 'A Festa Surpresa', 3, false, 10, 200),
('a1b2c3d4-0003-4000-8000-000000000003', 'O Mal-Entendido', 4, false, 10, 185),
('a1b2c3d4-0003-4000-8000-000000000003', 'O Grande Dia', 5, false, 15, 260);
