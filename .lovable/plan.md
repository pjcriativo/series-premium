

# Ajustar Intensidade do Efeito de Desfoque Lateral do Hero Slider

## Situacao Atual

O efeito de fade lateral esta funcionando, mas e muito sutil. Em tela cheia (1920px), os gradientes de `w-48` (192px) sao estreitos demais para criar a impressao de "tela infinita" como na referencia visual.

## Mudanca

### HeroSlider.tsx - Aumentar largura e intensidade dos gradientes

Atualizar as duas divs de gradiente lateral:

**De:**
```
w-16 md:w-32 lg:w-48
```

**Para:**
```
w-20 md:w-40 lg:w-64 xl:w-80
```

Isso aumenta a area de fade de 192px para 320px (xl) em telas grandes, criando um efeito muito mais pronunciado e semelhante a referencia.

Tambem adicionar `via-background/50` para um gradiente mais suave com transicao intermediaria:

```
bg-gradient-to-r from-background via-background/50 to-transparent
```

| Arquivo | Acao |
|---------|------|
| `src/components/HeroSlider.tsx` | Aumentar largura dos gradientes laterais e adicionar ponto intermediario no gradiente |

