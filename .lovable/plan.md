
# Aumentar a Altura do HeroSlider

## Comparacao
- **ReelShort original**: O slider ocupa ~60% da altura da viewport, proporcao proxima de 16:9
- **Nosso site atual**: Usa `aspect-[16/7]` (mobile) e `aspect-[16/6]` (desktop) — proporcionalmente bem mais baixo

## Alteracao

No arquivo `src/components/HeroSlider.tsx`, linha 48, alterar o aspect ratio dos slides:

### De:
```
aspect-[16/7] md:aspect-[16/6]
```

### Para:
```
aspect-[3/2] md:aspect-[16/9]
```

Isso deixa o slider com proporcao 3:2 no mobile (um pouco mais alto para telas pequenas) e 16:9 no desktop (similar ao ReelShort).

## Arquivo Afetado

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/HeroSlider.tsx` | Alterar aspect ratio de 16/7 e 16/6 para 3/2 e 16/9 |
