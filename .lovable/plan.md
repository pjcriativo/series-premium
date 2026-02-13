

# Redesign do PaywallModal - Layout identico ao original

## Diferencas identificadas entre o modal atual e o de referencia

| Aspecto | Referencia | Nosso atual |
|---------|-----------|-------------|
| Largura | ~850px (largo) | ~400px (estreito) |
| Secao de desbloqueio | 2 cards lado a lado (estilo VIP) com gradiente quente | Botoes empilhados verticalmente |
| Grid de moedas | 3 colunas, cards grandes com texto alinhado a esquerda, mostrando "Immediately: X / Free: Y", badge de bonus colorido no canto | 3 colunas, cards pequenos centralizados, sem detalhes |
| Headers de secao | Texto bold alinhado a esquerda ("Top up coins", "Payment Methods") | Texto centralizado com linhas divisorias |
| Pagamento | 3 botoes iguais em linha, com borda visivel e texto grande | 3 botoes pequenos centralizados |
| Titulo do episodio | Nao aparece no corpo | Aparece centralizado |

## Alteracoes no arquivo `src/components/PaywallModal.tsx`

### 1. Largura do modal
- Mudar de `sm:max-w-md` para `sm:max-w-2xl` (~672px)

### 2. Header (manter igual - ja esta bom)
- "Preco: (moeda) X | Saldo: (moeda) Y" + botao X

### 3. Secao de desbloqueio - 2 cards lado a lado
- Trocar os botoes empilhados por um grid de 2 colunas
- Card "Desbloquear episodio" a esquerda e "Desbloquear serie" a direita
- Cada card com gradiente sutil (`from-primary/20 to-purple-900/30`), borda `border-primary/30`
- Dentro de cada card: titulo, preco em moedas, subtexto, e icones de features na parte inferior (ex: icone + "Acesso imediato", icone + "Alta qualidade")
- Remover o titulo do episodio que aparece acima

### 4. Secao "Recarregar moedas"
- Header alinhado a esquerda, bold: "Recarregar moedas" (sem linhas divisorias)
- Grid 3 colunas com cards maiores
- Cada card com layout alinhado a esquerda:
  - Icone de moeda + quantidade em bold grande (ex: "1.150")
  - Linha "Imediato: 1.000"
  - Linha "Bonus: 150"
  - Preco em BRL no rodape do card
  - Badge de bonus colorido no canto superior direito (ex: "+15%") usando `bg-primary`
- O bonus sera calculado: se `coin_packages` tiver campo `bonus` ou calcular como percentual extra

### 5. Secao "Pagamento"
- Header alinhado a esquerda, bold: "Pagamento"
- 3 botoes iguais em grid de 3 colunas
- Cada botao com borda visivel, padding maior, texto centralizado
- "Cartao" (com icone CreditCard), "G Pay", "Mercado Pago"
- Primeiro botao com borda `border-primary` indicando selecao ativa

### 6. Logica mantida
- Todas as funcoes (handleUnlockEpisode, handleUnlockSeries, handleBuyCoins) permanecem identicas
- Props e interface sem alteracao
- Query de coin_packages mantida

## Resultado visual esperado
Modal largo, com secao de desbloqueio em 2 cards lado a lado no topo, seguido de grid de moedas com detalhes completos (bonus, imediato) e metodos de pagamento com botoes grandes - tudo nas cores dark/roxo/azul do nosso tema.

