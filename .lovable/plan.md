

# Admin: Users + Coin Adjustment Enhancement

## Overview

Enhance the UserManager page and the `buy-coins` edge function to support full balance adjustments (credit and debit) with negative-balance prevention, and add a transaction history dialog per user.

## Current State

- **UserManager**: Lists users with name, balance, roles, created_at. Has grant-coins dialog (credit only) and admin role toggle with confirmation. Search and pagination already work.
- **buy-coins edge function**: Has an `admin_grant` flow that only adds coins (credit). No debit support, no balance validation.
- **Missing**: No way to debit coins. No transaction history view. No negative-balance guard.

## Changes

### 1. `supabase/functions/buy-coins/index.ts` (Update)

Modify the `admin_grant` flow to support both credit and debit:

- Accept `coins` as a positive or negative number (positive = credit, negative = debit)
- Before applying a debit, check that `wallet.balance + coins >= 0`. If not, return a 400 error: "Saldo insuficiente"
- Set transaction `type` dynamically: `coins > 0 ? "credit" : "debit"`
- Store `Math.abs(coins)` in the transaction record (coins column stays positive, type indicates direction)

### 2. `src/pages/admin/UserManager.tsx` (Update)

**Adjust Coins Dialog** -- replace the simple "grant" dialog with a credit/debit selector:

- Add a toggle or select: "Creditar" / "Debitar"
- Amount input (always positive number)
- On submit: send positive coins for credit, negative coins for debit
- Show current balance in the dialog for reference

**Transaction History Dialog** -- new action button per user row:

- New icon button (Receipt/History icon) in the actions column
- Opens a Dialog showing recent transactions for that user
- Query `transactions` table filtered by `user_id`, ordered by `created_at desc`, limit 50
- Table columns: Date, Type (credit/debit badge), Reason, Coins, Ref ID

**Table column addition**: No email column needed (profiles table has no email). Keep current columns.

### 3. No Database Changes

The `transactions` table already supports `type: credit | debit` and `reason: admin_adjust`. Wallets table and RLS policies are already correct. Admin can already read all transactions and wallets via existing RLS policies.

## Technical Details

### Edge Function Debit Logic

```typescript
// In admin_grant flow
const coins = body.coins; // positive for credit, negative for debit
const newBalance = wallet.balance + coins;

if (newBalance < 0) {
  return new Response(
    JSON.stringify({ error: "Saldo insuficiente" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

await supabaseAdmin.from("wallets").update({ balance: newBalance }).eq("user_id", targetUserId);
await supabaseAdmin.from("transactions").insert({
  user_id: targetUserId,
  type: coins > 0 ? "credit" : "debit",
  reason: "admin_adjust",
  coins: Math.abs(coins),
  ref_id: user.id,
});
```

### Adjust Dialog UI

```typescript
const [adjustMode, setAdjustMode] = useState<"credit" | "debit">("credit");
const [coinAmount, setCoinAmount] = useState(100);

// On submit
const finalCoins = adjustMode === "credit" ? coinAmount : -coinAmount;
grantCoinsMutation.mutate({ userId, amount: finalCoins });
```

### Transaction History Dialog

```typescript
const [txDialog, setTxDialog] = useState<{ userId: string; name: string } | null>(null);

const { data: transactions } = useQuery({
  queryKey: ["admin-user-transactions", txDialog?.userId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", txDialog!.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },
  enabled: !!txDialog,
});
```

## Files Summary

| File | Action |
|------|--------|
| `supabase/functions/buy-coins/index.ts` | Update (add debit support + balance check) |
| `src/pages/admin/UserManager.tsx` | Update (credit/debit toggle + transaction history dialog) |

