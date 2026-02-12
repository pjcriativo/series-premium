

# Admin Panel Enhancement

## Overview

Upgrade the admin panel with a responsive layout (sidebar on desktop, drawer on mobile), add a "Pacotes de Moedas" (Coin Packages) management section, and add search + pagination + delete confirmation modals to all admin tables.

## What Exists

- **AdminRoute**: Already guards based on `isAdmin` from `useAuth` (checks `user_roles` table). No changes needed.
- **AdminLayout**: Desktop-only fixed sidebar with nav items. No mobile support.
- **Manager pages**: SeriesManager, EpisodeManager, UserManager, CategoryManager -- all have tables but no search, no pagination, and delete buttons fire immediately without confirmation.
- **Missing**: Coin Packages manager (the `coin_packages` table exists but has no admin CRUD page).
- **Routes**: Already wired in `App.tsx` under `/admin`.

## Changes

### 1. `src/pages/admin/AdminLayout.tsx` (Rewrite)

**Desktop**: Keep the fixed sidebar (current behavior).

**Mobile**: Replace fixed sidebar with a `Sheet` (slide-in drawer) triggered by a hamburger button in a top bar.

- Use `useIsMobile()` hook to detect viewport
- Desktop: render the sidebar as-is (fixed left, 256px wide)
- Mobile: render a top bar with hamburger + "Admin Panel" title, and a `Sheet` from the left containing the same nav items
- Nav items list stays the same but adds the new "Pacotes de Moedas" entry
- Clicking a nav item on mobile closes the drawer

**New nav item added:**
```typescript
{ to: "/admin/packages", icon: Coins, label: "Pacotes de Moedas" }
```

### 2. New File: `src/pages/admin/CoinPackageManager.tsx`

Full CRUD manager for coin packages, following the same pattern as CategoryManager:

- Table with columns: Title, Coins, Price (BRL), Stripe Price ID, Active, Actions
- Dialog form for create/edit with fields: title, coins, price_cents, stripe_price_id, is_active
- Delete with confirmation (using AlertDialog)
- Search input to filter by title
- Pagination (10 items per page)

### 3. Update All Manager Pages with Search, Pagination, and Delete Confirmation

Each manager page gets three enhancements:

**Search**: An `Input` field above the table that filters rows client-side by the main text column (title/name/display_name).

**Pagination**: Simple previous/next buttons below the table. 10 items per page. Shows "Page X of Y".

**Delete Confirmation**: Replace direct `deleteMutation.mutate(id)` calls with an `AlertDialog` that asks "Tem certeza que deseja excluir?" before proceeding. This applies to:
- `SeriesManager.tsx`
- `EpisodeManager.tsx`
- `UserManager.tsx` (no delete, but the admin toggle gets a confirmation)
- `CategoryManager.tsx`
- `CoinPackageManager.tsx` (new)

### 4. `src/App.tsx`

Add the new route:
```typescript
<Route path="packages" element={<CoinPackageManager />} />
```

## Technical Details

### Responsive Layout Pattern

```typescript
// AdminLayout.tsx
const isMobile = useIsMobile();
const [drawerOpen, setDrawerOpen] = useState(false);

// Shared nav list component
const NavItems = ({ onItemClick }) => (
  navItems.map(item => (
    <NavLink to={item.to} end={item.end} onClick={onItemClick} ...>
      <item.icon /> {item.label}
    </NavLink>
  ))
);

// Desktop: <aside className="fixed w-64 ..."><NavItems /></aside>
// Mobile: <Sheet open={drawerOpen}><SheetContent side="left"><NavItems onItemClick={() => setDrawerOpen(false)} /></SheetContent></Sheet>
```

### Reusable Delete Confirmation Pattern

Each manager will use `AlertDialog` inline:

```typescript
const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

// In table row:
<Button onClick={() => setDeleteTarget(item.id)}>
  <Trash2 />
</Button>

// At component bottom:
<AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
      <AlertDialogDescription>Esta acao nao pode ser desfeita.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={() => { deleteMutation.mutate(deleteTarget!); setDeleteTarget(null); }}>
        Excluir
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Search + Pagination Pattern

```typescript
const [search, setSearch] = useState("");
const [page, setPage] = useState(0);
const PAGE_SIZE = 10;

const filtered = (items ?? []).filter(i =>
  i.title.toLowerCase().includes(search.toLowerCase())
);
const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

// Reset page when search changes
useEffect(() => setPage(0), [search]);
```

### CoinPackageManager Form Fields

| Field | Type | Notes |
|-------|------|-------|
| title | text | Required |
| coins | number | Required, min 1 |
| price_cents | number | Required, displayed as BRL |
| stripe_price_id | text | Optional |
| is_active | switch | Default true |

## Files Summary

| File | Action |
|------|--------|
| `src/pages/admin/AdminLayout.tsx` | Rewrite (add mobile drawer + new nav item) |
| `src/pages/admin/CoinPackageManager.tsx` | Create (new CRUD page) |
| `src/pages/admin/SeriesManager.tsx` | Update (add search, pagination, delete confirm) |
| `src/pages/admin/EpisodeManager.tsx` | Update (add search, pagination, delete confirm) |
| `src/pages/admin/UserManager.tsx` | Update (add search, pagination, admin toggle confirm) |
| `src/pages/admin/CategoryManager.tsx` | Update (add search, pagination, delete confirm) |
| `src/App.tsx` | Update (add packages route) |

## No Database or Edge Function Changes

The `coin_packages` table already exists with proper RLS policies (admin CRUD, public read of active packages). No migrations needed.

