
UPDATE series SET cover_url = CASE title
  WHEN 'Amor em Chamas' THEN 'https://picsum.photos/seed/amor-em-chamas/400/600'
  WHEN 'Corações Cruzados' THEN 'https://picsum.photos/seed/coracoes-cruzados/400/600'
  WHEN 'Promessas ao Luar' THEN 'https://picsum.photos/seed/promessas-ao-luar/400/600'
  WHEN 'Sombras do Passado' THEN 'https://picsum.photos/seed/sombras-do-passado/400/600'
  WHEN 'O Último Segredo' THEN 'https://picsum.photos/seed/ultimo-segredo/400/600'
  WHEN 'Zona de Risco' THEN 'https://picsum.photos/seed/zona-de-risco/400/600'
  WHEN 'Confusões em Família' THEN 'https://picsum.photos/seed/confusoes-familia/400/600'
  WHEN 'Plantão Maluco' THEN 'https://picsum.photos/seed/plantao-maluco/400/600'
  WHEN 'Vizinhos Impossíveis' THEN 'https://picsum.photos/seed/vizinhos-impossiveis/400/600'
  WHEN 'Além do Horizonte' THEN 'https://picsum.photos/seed/alem-horizonte/400/600'
  WHEN 'Laços de Sangue' THEN 'https://picsum.photos/seed/lacos-sangue/400/600'
  WHEN 'A Última Chance' THEN 'https://picsum.photos/seed/ultima-chance/400/600'
  WHEN 'Operação Resgate' THEN 'https://picsum.photos/seed/operacao-resgate/400/600'
  WHEN 'Fogo Cruzado' THEN 'https://picsum.photos/seed/fogo-cruzado/400/600'
  WHEN 'Caçadores de Elite' THEN 'https://picsum.photos/seed/cacadores-elite/400/600'
  WHEN 'Reinos Perdidos' THEN 'https://picsum.photos/seed/reinos-perdidos/400/600'
  WHEN 'A Profecia do Dragão' THEN 'https://picsum.photos/seed/profecia-dragao/400/600'
  WHEN 'A Casa no Fim da Rua' THEN 'https://picsum.photos/seed/casa-fim-rua/400/600'
  WHEN 'Sussurros na Escuridão' THEN 'https://picsum.photos/seed/sussurros-escuridao/400/600'
  WHEN 'Geração Z' THEN 'https://picsum.photos/seed/geracao-z/400/600'
  WHEN 'Último Ano' THEN 'https://picsum.photos/seed/ultimo-ano/400/600'
END
WHERE cover_url IS NULL AND title IN (
  'Amor em Chamas','Corações Cruzados','Promessas ao Luar','Sombras do Passado',
  'O Último Segredo','Zona de Risco','Confusões em Família','Plantão Maluco',
  'Vizinhos Impossíveis','Além do Horizonte','Laços de Sangue','A Última Chance',
  'Operação Resgate','Fogo Cruzado','Caçadores de Elite','Reinos Perdidos',
  'A Profecia do Dragão','A Casa no Fim da Rua','Sussurros na Escuridão',
  'Geração Z','Último Ano'
);
