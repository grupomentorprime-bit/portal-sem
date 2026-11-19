### Task 4: Título Atención · Plataforma

**Files:**
- Modify: `src/components/desktop/DesktopAttention.tsx` (~línea del `title`)

- [ ] **Step 1: Derive title from channel + desk**

Replace:

```ts
const title = channel === "envivo" ? "Chat en vivo" : "Atención";
```

with:

```ts
const title =
  channel === "envivo"
    ? "Chat en vivo"
    : globalDesk
      ? "Atención · Plataforma"
      : "Atención";
```

Note: `globalDesk` already means `channel === "mensajes" && serverDesk === "platform" && mode === "panel"`. Keep company header unchanged (`Atención | {companyName}`).

- [ ] **Step 2: Run UI test for title**

Run: `npx tsx --test tests/baseline/desktop-attention-ui.test.ts`  
Expected: title assertion PASS

---

