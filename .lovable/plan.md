

# Edge Function: Stripe Webhook

## Overview

Create a new edge function `stripe-webhook` that receives Stripe `checkout.session.completed` events, verifies the webhook signature, enforces idempotency (no double-crediting), and credits the user's wallet with the purchased coins.

The function will be "ready but gated" -- it checks for the `STRIPE_WEBHOOK_SECRET` env var and returns 501 if not configured, so it can be deployed safely before Stripe is fully set up.

## Changes

### 1. New file: `supabase/functions/stripe-webhook/index.ts`

**Flow:**

1. Only accept POST requests
2. Check if `STRIPE_WEBHOOK_SECRET` is set; if not, return 501 ("Stripe not configured")
3. Read raw body and verify Stripe signature using `stripe-signature` header and HMAC-SHA256 (no Stripe SDK needed -- use Web Crypto API directly)
4. Parse event JSON, only handle `checkout.session.completed`
5. Extract from session metadata: `user_id` and `package_id`
6. **Idempotency check**: query `transactions` where `ref_id = event.id` -- if found, return 200 (already processed)
7. Look up `coin_packages` by `package_id` to get coin amount
8. Update wallet balance
9. Insert transaction with `type: "credit"`, `reason: "purchase"`, `ref_id: event.id`
10. Return 200

**Signature verification (no SDK):**

```text
Stripe sends: Stripe-Signature: t=timestamp,v1=signature
We compute: HMAC-SHA256(STRIPE_WEBHOOK_SECRET, "timestamp.rawBody")
Compare against the v1 signature
```

This avoids importing the full Stripe SDK just for signature verification.

**Env gating:**

```text
if (!STRIPE_WEBHOOK_SECRET) return 501 "Stripe not configured yet"
```

### 2. Update: `supabase/config.toml`

Add the webhook function with `verify_jwt = false` (Stripe sends unsigned requests):

```toml
[functions.stripe-webhook]
verify_jwt = false
```

### 3. No database changes

The existing `transactions` table already has `ref_id` (text) which will store the Stripe event ID for idempotency. The `wallets` table and all RLS policies are already in place. The edge function uses the service role key so RLS is bypassed.

### 4. No secrets added yet

The function requires `STRIPE_WEBHOOK_SECRET` to operate. Without it, the function gracefully returns 501. When the user is ready to connect Stripe, they will add this secret. The function code is safe to deploy now.

## Technical Details

### Signature Verification (Web Crypto)

```typescript
const sigHeader = req.headers.get("stripe-signature");
// Parse t= and v1= from header
const parts = Object.fromEntries(
  sigHeader.split(",").map(p => {
    const [k, v] = p.split("=");
    return [k, v];
  })
);
const payload = `${parts.t}.${rawBody}`;
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"]
);
const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
const computed = Array.from(new Uint8Array(sig))
  .map(b => b.toString(16).padStart(2, "0"))
  .join("");
if (computed !== parts.v1) return 400 "Invalid signature";
```

### Idempotency Check

```typescript
const { data: existing } = await supabaseAdmin
  .from("transactions")
  .select("id")
  .eq("ref_id", event.id)
  .maybeSingle();
if (existing) return 200 "Already processed";
```

### Expected Stripe Session Metadata

When creating a Checkout Session (future integration), the client will pass:
- `metadata.user_id` -- the Supabase user ID
- `metadata.package_id` -- the coin_packages ID

## Files Summary

| File | Action |
|------|--------|
| `supabase/functions/stripe-webhook/index.ts` | Create |
| `supabase/config.toml` | Update (add function entry) |

