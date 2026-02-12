
# Corrigir Efeito de Tela Infinita no Hero Slider + Link para Home no Login

## Problemas Identificados

1. **Fade lateral nao funciona**: O slider esta totalmente contido dentro do container `max-w-7xl` com `rounded-xl overflow-hidden`, entao nao ha conteudo visual nas laterais para aplicar o fade. O efeito precisa que a imagem do slider se estenda por toda a largura da tela.

2. **Preview vazio**: O site publicado mostra "Nenhuma serie disponivel ainda" porque os dados (series, banners) provavelmente nao foram publicados no ambiente Live. Isso e uma questao de dados, nao de codigo.

3. **Falta link para Home no Login**: A tela de autenticacao nao tem como voltar para a pagina principal.

## Mudancas

### 1. HeroSlider.tsx - Reestruturar para efeito de tela infinita

A ideia: o slider ocupa toda a largura da tela, mas o conteudo textual (titulo, botao) fica alinhado ao container `max-w-7xl`. Os gradientes laterais criam o fade nas bordas.

Estrutura proposta:

```
<div className="w-full relative pt-4">
  <!-- Slider FULL WIDTH (sem max-w-7xl, sem rounded) -->
  <section className="relative overflow-hidden">
    <div ref={emblaRef}>
      <!-- slides com imagem full-width -->
    </div>

    <!-- Fade lateral esquerdo (sobre a imagem) -->
    <div className="absolute left-0 inset-y-0 w-16 md:w-32 lg:w-48 
         bg-gradient-to-r from-background to-transparent z-10" />

    <!-- Fade lateral direito -->
    <div className="absolute right-0 inset-y-0 w-16 md:w-32 lg:w-48 
         bg-gradient-to-l from-background to-transparent z-10" />

    <!-- Conteudo textual centralizado em max-w-7xl -->
    <!-- Setas de navegacao -->
    <!-- Indicadores de dots -->
  </section>
</div>
```

Mudancas principais:
- Remover `max-w-7xl` e `rounded-xl` do container do slider para que as imagens ocupem toda a tela
- Adicionar gradientes laterais **dentro** da section, sobre as imagens, com larguras responsivas (`w-16 md:w-32 lg:w-48`)
- O conteudo textual (titulo, subtitulo, botao) fica dentro de um wrapper `max-w-7xl mx-auto` para manter o alinhamento
- Remover `hidden xl:block` dos gradientes para que aparecam em todas as telas

### 2. Auth.tsx - Adicionar link para a Home

Adicionar um botao/link "Voltar ao site" no topo do formulario ou no header mobile, usando o logo "ReelShort" como link para `/`.

- No painel direito (formulario), adicionar um link clicavel com o logo no topo que leva para `/`
- No mobile, o header de branding ja mostra "ReelShort" - torna-lo clicavel como Link para `/`

## Detalhes Tecnicos

### HeroSlider.tsx

| O que muda | De | Para |
|---|---|---|
| Container do slider | `max-w-7xl` com `rounded-xl overflow-hidden` | Full-width sem arredondamento |
| Gradientes laterais | `hidden xl:block` com calc complexo | Sempre visiveis, largura responsiva `w-16 md:w-32 lg:w-48` |
| Conteudo textual | Dentro do slide sem restricao | Dentro de `max-w-7xl mx-auto` |
| Wrapper externo | Container centralizado | Full-width `relative` |

### Auth.tsx

| O que muda | Como |
|---|---|
| Logo mobile | Envolver em `<Link to="/">` |
| Painel do formulario | Adicionar link "ReelShort" ou "Voltar ao site" no topo |

| Arquivo | Acao |
|---------|------|
| `src/components/HeroSlider.tsx` | Reestruturar para slider full-width com fades laterais |
| `src/pages/Auth.tsx` | Adicionar links para Home `/` |
