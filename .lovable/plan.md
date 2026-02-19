
# Melhorar o Painel Admin para Gerenciar duration_seconds

## Situação Atual

- Os 3 episódios publicados já têm `duration_seconds = 60` (definida pela migração anterior)
- O `EpisodeForm` já possui o campo "Duração (segundos)" funcional e salvo corretamente
- O `EpisodeManager` (tabela de listagem) **não mostra** a coluna de duração — o admin não tem visibilidade rápida de quais episódios estão com duração zerada

## O Que Será Feito

### 1. `src/pages/admin/EpisodeManager.tsx` — Adicionar coluna "Duração"

Adicionar uma coluna **"Duração"** na tabela, exibindo o valor em formato legível (`MM:SS` ou em segundos), com destaque visual quando o valor for 0:

```text
| Série | Ep. | Título         | Acesso | Preço | Duração | Status    | Ações |
|-------|-----|----------------|--------|-------|---------|-----------|-------|
| S.W.A.T | #1 | A equipe...  | Pago   | 10 🪙 | 1:00    | Publicado | ✎ 🗑  |
| S.W.A.T | #19| As famílias...| Pago  | 10 🪙 | 0:00 ⚠ | Publicado | ✎ 🗑  |
```

- Se `duration_seconds === 0` ou nulo: exibir badge vermelho `"Indefinida"` como alerta visual
- Se `duration_seconds > 0`: exibir em formato `MM:SS` (ex: `1:00` para 60 segundos, `10:30` para 630 segundos)

### 2. `src/pages/admin/EpisodeForm.tsx` — Melhorar o campo de duração

O campo "Duração (segundos)" existe, mas é pouco intuitivo:

- Adicionar um preview ao lado do input mostrando a conversão em `MM:SS` em tempo real (ex: digita `630` → mostra `10:30`)
- Adicionar texto de ajuda: `"Dica: 60 = 1 minuto · 600 = 10 minutos · 3600 = 1 hora"`

## Formato de Exibição

Função utilitária inline para formatar segundos:

```typescript
const formatDuration = (secs: number) => {
  if (!secs || secs <= 0) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};
```

## Arquivos Alterados

| Arquivo | Mudança |
|---|---|
| `src/pages/admin/EpisodeManager.tsx` | Nova coluna "Duração" com formatação `MM:SS` e badge de alerta quando zerada |
| `src/pages/admin/EpisodeForm.tsx` | Preview `MM:SS` ao lado do input e texto de ajuda contextual |

## O Que NÃO Será Alterado
- Nenhuma migração de banco
- Lógica de save/update permanece idêntica
- Nenhum outro componente é afetado
