

# Deploy Checklist + Domain Configuration

## Overview

Prepare the app for production deployment by updating metadata, validating all environment configurations, and providing a step-by-step checklist for external services (Supabase, Google OAuth, Stripe, Domain).

## Code Changes

### 1. `index.html` -- Update metadata

Replace placeholder titles and descriptions with actual app branding:

- `<title>` -> "ReelShort"
- `og:title` -> "ReelShort"
- `og:description` -> "Series curtas e envolventes para maratonar a qualquer momento"
- `meta description` -> same
- `meta author` -> your brand name
- Remove the TODO comments
- Replace `og:image` and `twitter:image` with your own social preview image URL (or keep for now)

### 2. `supabase/config.toml` -- Add buy-coins function

The `buy-coins` edge function is missing from config.toml. Add it:

```toml
[functions.buy-coins]
verify_jwt = false
```

This ensures it deploys correctly alongside the other functions.

### 3. No base path changes needed

Vite is configured with default base `/`, which is correct for Lovable deploy. BrowserRouter uses `/` as well. SPA routing is handled by the hosting platform automatically.

## Validation Status

| Item | Status | Notes |
|------|--------|-------|
| Supabase URL + Anon Key | OK | Hardcoded in `client.ts`, correct for this project |
| Service Role Key (edge fns) | OK | Set as Supabase secret |
| Storage bucket: `covers` (public) | OK | Already created |
| Storage bucket: `videos` (private) | OK | Already created |
| Edge functions deployed | OK | `unlock-episode`, `buy-coins`, `stripe-webhook` |
| SPA routing | OK | BrowserRouter with `/`, Lovable handles fallback |
| Build config | OK | Vite default, no base path issues |

## External Configuration Checklist (Manual Steps)

These are actions you need to do outside of Lovable:

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/) -> APIs & Services -> Credentials
2. In your OAuth 2.0 Client, add to **Authorized redirect URLs**:
   - `https://pnuydoujbrpfhohsxndz.supabase.co/auth/v1/callback`
3. Add to **Authorized JavaScript origins**:
   - Your published Lovable URL (e.g., `https://your-app.lovable.app`)
   - Your custom domain (e.g., `https://yourdomain.com`)
4. In [Supabase Dashboard -> Auth -> URL Configuration](https://supabase.com/dashboard/project/pnuydoujbrpfhohsxndz/auth/url-configuration):
   - Set **Site URL** to your production URL
   - Add redirect URLs for your custom domain

### Stripe (when ready)

1. Get your **Webhook Signing Secret** from the Stripe Dashboard -> Developers -> Webhooks
2. Create a webhook endpoint pointing to:
   - `https://pnuydoujbrpfhohsxndz.supabase.co/functions/v1/stripe-webhook`
3. Subscribe to the event: `checkout.session.completed`
4. Add the signing secret as a Supabase secret named `STRIPE_WEBHOOK_SECRET` via the [Edge Functions Secrets page](https://supabase.com/dashboard/project/pnuydoujbrpfhohsxndz/settings/functions)
5. Optionally add `STRIPE_SECRET_KEY` if you implement server-side Checkout Session creation

### Custom Domain

1. In Lovable: go to Project Settings -> Domains -> Connect Domain
2. At your domain registrar, add:
   - **A record**: `@` -> `185.158.133.1`
   - **A record**: `www` -> `185.158.133.1`
   - **TXT record**: `_lovable` -> the verification value Lovable provides
3. Wait for DNS propagation (up to 72h)
4. SSL is provisioned automatically by Lovable
5. After domain is active, update:
   - Supabase Auth -> Site URL to your custom domain
   - Google OAuth -> add custom domain to authorized origins and redirects
   - Stripe webhook -> no change needed (uses Supabase function URL directly)

## Files Summary

| File | Action |
|------|--------|
| `index.html` | Update metadata (title, og tags, descriptions) |
| `supabase/config.toml` | Add `buy-coins` function entry |

