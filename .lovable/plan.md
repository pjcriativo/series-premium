
# Rebranding Completo: ReelShort → Epsodiox

## O que será feito

Substituição total do nome "ReelShort" pelo novo nome "Epsodiox" em todos os arquivos do projeto, adição da logo enviada pelo usuário e criação de um favicon com ícone de play.

---

## Arquivos a modificar

### 1. `index.html` — Metadados e favicon
- `<title>ReelShort</title>` → `<title>Epsodiox</title>`
- `meta name="author"` → `Epsodiox`
- `og:title` → `Epsodiox`
- `twitter:site` → `@Epsodiox`
- `<link rel="icon">` → apontar para o novo `/favicon.png` (ícone de play gerado)

### 2. `src/components/Navbar.tsx` — Logo no menu principal
- Substituir o texto `ReelShort` pela logo da imagem enviada (`epsodiox-logo.png`)
- A logo ficará como `<img>` com altura fixa (`h-8` ou similar), clicável para a Home

### 3. `src/pages/Auth.tsx` — Branding na tela de login
- Substituir as 2 ocorrências do texto `ReelShort` pela logo
- No painel desktop (esquerdo): logo grande centralizada
- No header mobile: logo menor

### 4. `src/pages/Brand.tsx` — Email de contato
- `contato@reelshort.com` → `contato@epsodiox.com`

### 5. Geração do favicon (ícone de play)
- Copiar a logo enviada (`user-uploads://logo-BHHylVbj.png`) para:
  - `public/favicon.png` (favicon)
  - `src/assets/epsodiox-logo.png` (para uso nos componentes React)

---

## Detalhes técnicos

```text
Fluxo de assets:
  user-uploads://logo-BHHylVbj.png
    -> COPY -> public/favicon.png  (favicon do browser, tag do <head>)
    -> COPY -> src/assets/epsodiox-logo.png  (importada nos componentes)

Componentes que exibem a logo:
  Navbar.tsx       -> <img src={logo} className="h-8 w-auto" alt="Epsodiox" />
  Auth.tsx (desk)  -> <img src={logo} className="h-16 w-auto" alt="Epsodiox" />
  Auth.tsx (mob)   -> <img src={logo} className="h-10 w-auto" alt="Epsodiox" />
```

### Ocorrências de "ReelShort" a substituir:

| Arquivo | Tipo de mudança |
|---|---|
| `index.html` | title, meta author, og:title, twitter:site |
| `src/components/Navbar.tsx` | texto → logo image |
| `src/pages/Auth.tsx` | 2x texto → logo image |
| `src/pages/Brand.tsx` | email de contato |

### O que NÃO muda:
- Rotas, hooks, lógica de negócio — nenhum nome técnico interno contém "ReelShort"
- README.md — é arquivo de documentação interna, não impacta o usuário final
