@AGENTS.md

# CLAUDE.md — Udub Mart app (iPhone & Android)

The customer app for the Udub Mart store (e.udub.so). Expo SDK 58 + Expo Router + TypeScript.
App ID `so.udub.mart` on both stores — never change it (it can't change after publishing).

## Rules

1. **The website is the brain.** Every price, total, stock, rule and permission comes from the
   mobile API (`udub-store`: `docs/MOBILE_API.md`, `src/app/api/mobile/`). The app never
   computes a total or trusts its own price — it sends ids/qty/options and shows what comes back.
   A missing endpoint is added on the website (same rules as the website), not faked in the app.
2. **All API calls go through `src/lib/api.ts`** (`api()` / `useApi()`): base URL, Bearer token,
   language, `{ error: { code, message } }` errors, and sign-out on 401.
3. **Money is an integer of US cents**; show it with `fmtMoney`/`fmtMoney2` (`src/lib/money.ts`).
4. **The token lives only in secure storage** (`src/lib/storage.ts`, expo-secure-store) — never
   AsyncStorage or plain files.
5. **Every customer string is in `src/lib/dict.ts`** in Somali and English — reuse the website's
   wording (`udub-store/src/lib/dict.ts`) where it exists; never a literal in a screen.
6. **Types in `src/lib/types.ts` mirror the API's allowlisted shapes** (`lib/mobile/shapes.ts` on
   the website) — update both sides together.
7. Website paths in links (Showcase, notifications) map to screens in `src/lib/links.ts`.
8. The cart is the account's saved cart on the website: `PUT /cart` replaces it whole
   (`src/lib/cart.ts`).
9. Native tabs (`(tabs)/_layout.tsx`) don't run in a browser; `_layout.web.tsx` is a plain-tabs
   stand-in for the web preview only. Don't use `<Link asChild>` around a `Pressable` with a
   style array — use `Pressable onPress={() => router.push(...)}`.
10. Install packages with `npx expo install` (SDK-matched versions). Run `npx tsc --noEmit` and
    `npx expo export --platform android` before committing.
