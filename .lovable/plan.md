
# Gerar nova imagem Open Graph (og-image.png) para o Epsodiox

## Verificacao concluida

Todos os elementos de branding estao funcionando corretamente:
- Home: logo na navbar ok
- Login: logo no painel esquerdo ok
- Brand: logo na navbar, email contato@epsodiox.com ok
- Favicon: favicon.png com ícone de play ok

## O que sera feito

Gerar uma nova imagem de Open Graph (1200x630px) com a identidade visual do Epsodiox para substituir o `public/og-image.png` atual.

## Design da imagem OG

A imagem sera gerada com IA (Gemini) contendo:
- Fundo escuro cinematografico (degradê dark roxo/preto)
- Logo do Epsodiox centralizada (ícone de play + texto)
- Tagline: "Series curtas e envolventes para maratonar a qualquer momento"
- Elementos visuais: luzes de cinema, reel de filme sutil, atmosfera premium
- Dimensoes: 1200 x 630px (padrao OG / Twitter Card)

## Arquivo modificado

- `public/og-image.png` — substituido pela nova imagem gerada

## Como sera usado

O `index.html` ja referencia `/og-image.png` nas meta tags:
```html
<meta property="og:image" content="/og-image.png" />
<meta name="twitter:image" content="/og-image.png" />
```

Nenhuma alteracao no HTML e necessaria, apenas substituir o arquivo.
