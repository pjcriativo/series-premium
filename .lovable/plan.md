
# Redesign do PaywallModal inspirado no ReelShort

## Objetivo
Recriar o modal de desbloqueio de episodio seguindo o layout do site de referencia, mantendo as cores do nosso tema (dark com acentos em roxo/azul). O modal abrira ao clicar em episodio bloqueado no grid do player.

## Layout do novo modal (de cima para baixo)

1. **Barra superior**: "Preco: (moeda) X | Saldo: (moeda) Y" + botao fechar (X)
2. **Secao "Desbloquear serie"**: Card com gradiente dourado/warm adaptado ao nosso tema, oferecendo desbloqueio da serie completa com preco total
3. **Secao "Recarregar moedas"**: Grid 2x3 com os pacotes de moedas do banco (coin_packages), cada card mostrando quantidade de moedas, preco em BRL, e badge de bonus quando aplicavel
4. **Secao "Metodos de Pagamento"**: 3 botoes lado a lado - Cartao, Google Pay, Mercado Pago

## Estrutura do modal

O modal deixa de ser simples (apenas botoes de desbloquear) e passa a ser um mini-store completo, evitando que o usuario precise navegar para `/wallet`.

## Detalhes tecnicos

### Arquivo: `src/components/PaywallModal.tsx` (reescrita completa)

**Interface mantida** - mesmas props, sem breaking changes nos componentes que o usam.

**Novo layout interno**:
- Header customizado (sem DialogHeader padrao) com "Preco" e "Saldo" lado a lado
- Secao de desbloqueio da serie (se `seriesId` e `seriesTotalCost` disponiveis e saldo suficiente) com botao de acao
- Secao de desbloqueio do episodio individual com botao de acao
- Grid de coin packages (busca do Supabase via useQuery dentro do modal)
- Secao de metodos de pagamento com 3 botoes: Cartao (icone CreditCard), Google Pay (texto "G Pay"), Mercado Pago (texto)
- ScrollArea para permitir scroll no conteudo do modal

**Queries adicionadas dentro do modal**:
- `coin-packages`: buscar pacotes ativos do banco
- `wallet`: ja recebe o balance via prop, nao precisa query extra

**Acoes**:
- Botao "Desbloquear episodio" e "Desbloquear serie" mantidos (logica existente)
- Cards de pacotes de moedas: chamam a mesma funcao `buy-coins` do edge function
- Botoes de pagamento: por enquanto apenas visuais (placeholder para integracao futura)

### Arquivo: `src/pages/EpisodePlayer.tsx`
- Sem alteracoes - ja passa todas as props necessarias

### Arquivo: `src/pages/CoinStore.tsx`
- Sem alteracoes - continua existindo como pagina separada

### Banco de dados
- Sem alteracoes de schema. Usa a tabela `coin_packages` existente
- Campo `bonus_coins` nao existe ainda; o modal calculara bonus como diferenca ou usara um campo do titulo para mostrar badges

## Estilo visual (mantendo nossas cores)

| Elemento | Estilo |
|----------|--------|
| Fundo do modal | `bg-card` (dark) com `border-border` |
| Secao serie | Gradiente sutil `from-primary/20 to-purple-500/10` com borda `border-primary/30` |
| Cards de moedas | `bg-secondary/50` com `border-border`, hover com `border-primary/50` |
| Badges de bonus | `bg-primary text-primary-foreground` pequeno no canto superior direito |
| Botoes de pagamento | `bg-secondary` com `border-border`, icones brancos |
| Textos | `text-foreground` e `text-muted-foreground` conforme hierarquia |

## Fluxo do usuario
1. Clica em episodio bloqueado no grid
2. Modal abre mostrando preco do episodio e saldo atual
3. Se tem saldo: pode desbloquear episodio ou serie diretamente
4. Se nao tem saldo: ve os pacotes de moedas e pode comprar ali mesmo
5. Metodos de pagamento na parte inferior
