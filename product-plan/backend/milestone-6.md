# Admin UI + Admin API Implementation Plan

## Context

The product plan's milestone 6 specifies admin API endpoints but explicitly states "No admin UI." The user wants a sleek admin UI built into the frontend that consumes these real API endpoints. This requires:

1. Backend: Admin API routes (CRUD for Products, Categories, Shops, FAQ, About, Contact Messages) with admin auth guard
2. Frontend: Auth infrastructure (AuthContext), admin layout with sidebar navigation, reusable admin components, and pages for each entity

Auth will use the Authentik OIDC approach from milestone 5. Since Authentik isn't wired up yet, we'll build the AuthContext with the correct interface and use a temporary dev-mode auth (the existing mock auth enhanced with isAdmin) that can be swapped for real OIDC later.

---

## Part 1: Backend Admin API

### 1.1 Auth dependency — `backend/app/api/dependencies.py` (NEW)

- `get_current_user` — extracts Bearer token, validates it, looks up User. For now (pre-Authentik), accept an `X-Dev-User-Email` header when `settings.DEBUG=True` that looks up user by email.
- `require_admin` — depends on `get_current_user`, checks `user.is_admin`, raises 403 if not.

### 1.2 Admin schemas — modify existing + new files

- `backend/app/schemas/product.py` — Add: `ProductCreate`, `ProductUpdate`, `ProductAdminResponse`, `CategoryCreate`, `CategoryUpdate`, `CategoryAdminResponse`, `ShopCreate`, `ShopUpdate`, `BulkProductItem`, `BulkProductResponse`, `PaginatedResponse[T]`
- `backend/app/schemas/faq.py` — Add: `FaqItemCreate`, `FaqItemUpdate`, `FaqItemAdminResponse`, `FaqReorderItem`
- `backend/app/schemas/about.py` — Add: `AboutContentCreate`, `AboutContentUpdate`, `AboutContentAdminResponse`
- `backend/app/schemas/contact.py` (NEW) — `ContactMessageResponse`

All admin response schemas include `is_published`, timestamps, and all fields. Use camelCase aliases consistent with existing schemas.

### 1.3 Admin route modules — `backend/app/api/routes/admin/` (NEW package)

- `__init__.py` — Aggregates sub-routers under `/admin` prefix
- `products.py` — GET `/api/admin/products` (paginated), GET `/api/admin/products/{id}`, POST `/api/admin/products`, PUT `/api/admin/products/{id}`, DELETE `/api/admin/products/{id}`, POST `/api/admin/products/bulk`, GET `/api/admin/categories`, POST `/api/admin/categories`, PUT `/api/admin/categories/{id}`, GET `/api/admin/shops`, POST `/api/admin/shops`, PUT `/api/admin/shops/{id}`
- `faq.py` — GET `/api/admin/faq`, POST `/api/admin/faq`, PUT `/api/admin/faq/{id}`, DELETE `/api/admin/faq/{id}`, PUT `/api/admin/faq/reorder`
- `about.py` — GET `/api/admin/about`, POST `/api/admin/about`, PUT `/api/admin/about/{id}`, DELETE `/api/admin/about/{id}`
- `contacts.py` — GET `/api/admin/contacts` (paginated), GET `/api/admin/contacts/{id}` (read-only)

Pagination: `?page=1&page_size=50`, response `{ items, total, page, page_size }`. Reusable `paginate()` helper.

### 1.4 Wire admin router — modify `backend/app/api/__init__.py`

Add `from app.api.routes.admin import admin_router` and `api_router.include_router(admin_router)`.

### 1.5 Config — modify `backend/app/config.py`

Add `DEBUG: bool = False` setting for the dev-mode auth bypass.

---

## Part 2: Frontend Auth Infrastructure

### 2.1 AuthContext — `frontend/src/contexts/AuthContext.tsx` (NEW)

```typescript
interface AuthUser {
  id: string
  email: string
  name: string
  avatarUrl?: string
  isAdmin: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: () => void
  logout: () => void
  getAccessToken: () => string | null
}
```

Initial implementation: wraps the existing mock localStorage auth but adds `isAdmin: true` for the mock user. When Authentik lands, swap to OIDC redirect flow — interface stays the same.

### 2.2 Update API client — modify `frontend/src/api/client.ts`

Inject `Authorization: Bearer <token>` header from AuthContext. Add 401 response handling → trigger re-auth.

### 2.3 Update App.tsx — modify `frontend/src/App.tsx`

- Wrap in `<AuthProvider>`
- Remove inline `loadUser`, `USER_STORAGE_KEY`, `handleAuthSuccess`
- `RequireAuth` reads from `useAuth()` context
- Add `RequireAdmin` wrapper checking `isAdmin`
- Add `/admin/*` nested routes (see Part 4)

---

## Part 3: Admin Layout

The admin gets its own layout with sidebar navigation, separate from the public AppShell.

### 3.1 Layout components — `frontend/src/components/admin/layout/` (NEW)

- `AdminLayout.tsx` — Sidebar + header + `<Outlet />` for nested routes. No footer.
- `AdminSidebar.tsx` — Collapsible sidebar with lucide-react icons: Dashboard (LayoutDashboard), Products (Package), Categories (Grid3X3), Shops (Store), FAQ (HelpCircle), About (FileText), Messages (MessageSquare). Active state uses emerald highlight. Collapses to hamburger on mobile.
- `AdminHeader.tsx` — Compact header: "Admin" badge next to logo, breadcrumb, user avatar + logout, link back to public site.

### 3.2 Admin nav entry — modify `frontend/src/components/shell/UserMenu.tsx`

Add "Admin" link visible only when `isAdmin` is true. Links to `/admin`.

---

## Part 4: Reusable Admin Components — `frontend/src/components/admin/shared/` (NEW)

- `AdminDataTable.tsx` — Generic typed table: columns config, loading skeletons, empty state, pagination controls, row hover, optional row selection. Stone zebra stripes, sticky header.
- `SlidePanel.tsx` — Right-side slide-out panel for create/edit forms. Backdrop overlay, Escape/click-outside close, sticky header+footer, scrollable content. Widths: sm/md/lg.
- `SearchFilterBar.tsx` — Search input + filter dropdowns + right-aligned action buttons (e.g., "Add New").
- `StatusBadge.tsx` — Pill badge with variants: success (emerald/published), warning (amber/draft), neutral, danger.
- `ConfirmDialog.tsx` — Centered modal for delete confirmations with danger-styled confirm button.
- Form components: `FormField.tsx`, `TextInput.tsx`, `TextArea.tsx`, `SelectInput.tsx`, `NumberInput.tsx`, `ToggleSwitch.tsx`, `ImageUrlInput.tsx` (URL input with preview thumbnail). All follow consistent styling: stone borders, emerald focus ring, error states in red.
- `AdminSkeleton.tsx` — Table-shaped skeleton loader for admin pages.

---

## Part 5: Admin API Client — `frontend/src/api/admin/` (NEW)

- `products.ts` — `fetchAdminProducts(page)`, `fetchAdminProduct(id)`, `createProduct(data)`, `updateProduct(id, data)`, `deleteProduct(id)`, `bulkImportProducts(items)`, `fetchAdminCategories()`, `createCategory(data)`, `updateCategory(id, data)`, `fetchAdminShops()`, `createShop(data)`, `updateShop(id, data)`
- `faq.ts` — `fetchAdminFaq()`, `createFaqItem(data)`, `updateFaqItem(id, data)`, `deleteFaqItem(id)`, `reorderFaq(items)`
- `about.ts` — `fetchAdminAbout()`, `createAboutSection(data)`, `updateAboutSection(id, data)`, `deleteAboutSection(id)`
- `contacts.ts` — `fetchAdminContacts(page)`, `fetchAdminContact(id)`

Admin types in `frontend/src/components/admin/types.ts` — mirrors backend admin response schemas in camelCase.

### useAdminResource hook — `frontend/src/hooks/useAdminResource.ts` (NEW)

Generic hook for list pages: fetch, loading, error, pagination state, refresh. Keeps pages thin.

### useToast hook — `frontend/src/hooks/useToast.ts` (NEW)

Toast notifications for success/error feedback. Auto-dismiss after 4s. Rendered via ToastContainer in AdminLayout.

---

## Part 6: Admin Pages — `frontend/src/pages/admin/` (NEW)

### 6.1 Dashboard (AdminDashboardPage.tsx)

Stat cards with counts: products, categories, shops, FAQ items, about sections, contact messages. Each links to its admin page.

### 6.2 Products (AdminProductsPage.tsx)

Table: Name, Category (badge), Shop, Price, Published (badge), Updated. Search by name. Filter by category, shop, published status. Create/edit via slide panel with all product fields. Bulk import button opens panel with JSON textarea.

### 6.3 Categories (AdminCategoriesPage.tsx)

Table: Name, Slug, Icon, Display Order. Create/edit via slide panel. No pagination (low cardinality).

### 6.4 Shops (AdminShopsPage.tsx)

Table: Name, Logo (thumbnail), Affiliate Tag. Create/edit via slide panel. No pagination.

### 6.5 FAQ (AdminFaqPage.tsx)

Table: Question (truncated), Category (badge), Order, Published (badge), Updated. Create/edit via slide panel. Reorder via up/down arrow buttons calling PUT `/api/admin/faq/reorder`.

### 6.6 About (AdminAboutPage.tsx)

Table: Section Key, Title, Published (badge), Order, Updated. Create/edit via slide panel with body textarea.

### 6.7 Contact Messages (AdminContactsPage.tsx)

Table: Name, Email, Category (badge), Message (truncated), Date. Read-only. Click opens slide panel with full message. Search by name/email. Filter by category.

### Route structure in App.tsx:

```jsx
<Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
  <Route index element={<AdminDashboard />} />
  <Route path="products" element={<AdminProducts />} />
  <Route path="categories" element={<AdminCategories />} />
  <Route path="shops" element={<AdminShops />} />
  <Route path="faq" element={<AdminFaq />} />
  <Route path="about" element={<AdminAbout />} />
  <Route path="contacts" element={<AdminContacts />} />
</Route>
```

All pages lazy-loaded with AdminSkeleton fallback.

---

## Implementation Order

1. Backend admin API (Part 1) — dependencies, schemas, routes
2. Frontend AuthContext (Part 2) — context, client update, App.tsx refactor
3. Admin layout + routing (Part 3) — layout shell with sidebar, nested routes
4. Reusable components (Part 4) — data table, slide panel, forms, badges
5. Admin API client (Part 5) — typed fetch functions, hooks
6. Admin pages (Part 6) — Dashboard first, then Products (most complex, sets the pattern), then Categories, Shops, FAQ, About, Contacts
7. Polish — loading states, error handling, responsive, dark mode throughout

---

## Key Files Modified

| File | Action |
|------|--------|
| `backend/app/api/dependencies.py` | NEW |
| `backend/app/api/routes/admin/__init__.py` | NEW |
| `backend/app/api/routes/admin/products.py` | NEW |
| `backend/app/api/routes/admin/faq.py` | NEW |
| `backend/app/api/routes/admin/about.py` | NEW |
| `backend/app/api/routes/admin/contacts.py` | NEW |
| `backend/app/schemas/product.py` | MODIFY — add admin schemas |
| `backend/app/schemas/faq.py` | MODIFY — add admin schemas |
| `backend/app/schemas/about.py` | MODIFY — add admin schemas |
| `backend/app/schemas/contact.py` | NEW |
| `backend/app/api/__init__.py` | MODIFY — register admin router |
| `backend/app/config.py` | MODIFY — add DEBUG setting |
| `frontend/src/contexts/AuthContext.tsx` | NEW |
| `frontend/src/api/client.ts` | MODIFY — token injection |
| `frontend/src/App.tsx` | MODIFY — AuthProvider, admin routes |
| `frontend/src/components/shell/UserMenu.tsx` | MODIFY — admin link |
| `frontend/src/components/admin/layout/*.tsx` | NEW (3 files) |
| `frontend/src/components/admin/shared/*.tsx` | NEW (~12 files) |
| `frontend/src/components/admin/types.ts` | NEW |
| `frontend/src/api/admin/*.ts` | NEW (5 files) |
| `frontend/src/hooks/useAdminResource.ts` | NEW |
| `frontend/src/hooks/useToast.ts` | NEW |
| `frontend/src/pages/admin/*.tsx` | NEW (7 files) |

---

## Verification

1. `make dev` — backend + frontend start without errors
2. Log in as mock user → UserMenu shows "Admin" link
3. Navigate to `/admin` → admin dashboard loads with stat cards
4. Navigate to Products → table loads from GET `/api/admin/products`
5. Click "Add New" → slide panel opens, fill form, submit → product created
6. Click row → edit panel opens, modify, save → product updated
7. Delete product → confirmation dialog → product removed
8. Test each entity page (Categories, Shops, FAQ, About, Contacts)
9. FAQ reorder: click up/down arrows → order persists
10. Contact messages: read-only, click to view full message
11. Non-admin user → `/admin` redirects to `/planner`
12. Dark mode toggle → all admin components render correctly
13. Mobile viewport → sidebar collapses, table scrolls horizontally, panels go full-screen
14. `npm run build` succeeds with no TypeScript errors
