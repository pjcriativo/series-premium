

# Remover Referencias "Lovable" e Atualizar Branding para ReelShort

## O que sera alterado

### 1. index.html - Remover meta tags com links Lovable

As meta tags de Open Graph e Twitter apontam para imagens e perfil do Lovable. Serao atualizadas para ReelShort:

- `og:image`: remover URL `lovable.dev/opengraph-image-p98pqg.png` (substituir por `/og-image.png` local ou remover temporariamente)
- `twitter:site`: trocar `@Lovable` por `@ReelShort`
- `twitter:image`: mesma correcao do og:image
- Adicionar referencia ao favicon corretamente com `<link rel="icon">`

### 2. Favicon

O favicon atual (`public/favicon.ico`) provavelmente e o padrao do Lovable. Como nao ha uma imagem personalizada disponivel, sera mantido o arquivo existente mas a referencia no HTML sera explicitada. Se desejar, voce pode enviar uma imagem para usar como favicon personalizado.

### 3. Arquivos NAO alterados (e por que)

| Arquivo | Motivo |
|---------|--------|
| `vite.config.ts` (`lovable-tagger`) | Ferramenta de desenvolvimento interna, nao aparece para usuarios |
| `package.json` (`lovable-tagger`) | Dependencia de dev, nao afeta o produto final |
| `supabase/functions/generate-covers/index.ts` (`LOVABLE_API_KEY`, `ai.gateway.lovable.dev`) | Sao endpoints e variaveis de ambiente funcionais da infraestrutura -- renomea-los quebraria a geracao de imagens |

## Detalhes Tecnicos

### index.html

```html
<!-- ANTES -->
<meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
<meta name="twitter:site" content="@Lovable" />
<meta name="twitter:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />

<!-- DEPOIS -->
<link rel="icon" href="/favicon.ico" type="image/x-icon" />
<meta property="og:image" content="/og-image.png" />
<meta name="twitter:site" content="@ReelShort" />
<meta name="twitter:image" content="/og-image.png" />
```

As imagens OG apontarao para `/og-image.png` (caminho local). Se voce tiver uma imagem de compartilhamento social, pode envia-la depois para colocar em `public/og-image.png`.

| Arquivo | Acao |
|---------|------|
| `index.html` | Remover URLs lovable.dev, atualizar twitter:site, adicionar link rel="icon" |

