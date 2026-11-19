### Task 3: Compose — placeholder, disable y remount

**Files:**
- Modify: `src/components/desktop/DesktopAttention.tsx`

**Interfaces:**
- Consumes: `Compose` actual (`tenantId` inicia en `""`, `companyReady`)
- Produces: `composeSession` number; `openComposer` incrementa; `key={composeSession}` en ambos mounts de `Compose` (panel y company)

- [ ] **Step 1: Add composeSession state and bump on open**

Near other state in `DesktopAttention`:

```ts
const [composeSession, setComposeSession] = useState(0);
```

Update `openComposer`:

```ts
function openComposer() {
  setComposeSession((n) => n + 1);
  setComposing(true);
  setReceipt(null);
  setSelectedId("");
  setSelectedTenantId("");
}
```

- [ ] **Step 2: Pass key to Compose instances**

On every `<Compose ... />` in the platform frame and in `CompanySpace`:

```tsx
<Compose
  key={composeSession}
  ...
/>
```

In `CompanySpace`, accept `composeSession: number` as prop and pass `key={composeSession}` to its `Compose`.

- [ ] **Step 3: Fix placeholder copy**

In Compose select (platform, not fixed company):

```tsx
<option value="">Seleccionar empresa</option>
```

Ensure there is no `Elige una empresa` left in the file.

Confirm submit stays:

```tsx
disabled={sending || !body.trim() || !areaId || !companyReady}
```

with `companyReady = mode !== "panel" || Boolean(lockedTenantId || tenantId)`.

- [ ] **Step 4: Re-run UI test partial**

Run: `npx tsx --test tests/baseline/desktop-attention-ui.test.ts`  
Expected: PASS on Seleccionar empresa + composeSession; may still FAIL on título/Aplicar until Task 4–5.

---

