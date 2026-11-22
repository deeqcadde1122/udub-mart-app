# Udub Mart — iPhone & Android app

The Udub Mart shopping app. One codebase for iPhone and Android, built with **Expo (SDK 58)**,
**Expo Router** and TypeScript. App ID: `so.udub.mart`.

The app has no database or prices of its own: everything comes from the website's mobile API
at `https://e.udub.so/api/mobile/` (repo `udub-store`, see its `docs/MOBILE_API.md`).

## What's in it (step 2)

- **Sign-in** with phone number + 6-digit code (new accounts are asked for their name)
- **Home**: search, Showcase, categories, deals, recommended, new arrivals, stores
- **Categories**, **search results / product lists** (category, store, deals) with "did you mean"
- **Product page**: photos, price, options (colour/size, incl. imported-product variants),
  quantity, description, how to use, ingredients, reviews, questions, similar products, Add to Cart
- **Cart**: the account's saved cart (same as the website), change quantity, totals
- **Account**: wallet and points, Somali/English, help/privacy/terms, sign out, delete account

Not yet: checkout and payment, orders, messages, notifications, wishlist, addresses, Google
sign-in, push notifications.

## Try it on your phone

1. Install **Expo Go** from the App Store or Google Play.
2. On a computer with Node.js: `npm install`, then `npx expo start`.
3. Scan the QR code (iPhone: with the Camera app; Android: from inside Expo Go).

To point the app at another server (e.g. a local copy of the website), start it with
`EXPO_PUBLIC_API_URL=http://<computer-ip>:3001/api/mobile npx expo start`.

## Checks

```bash
npx tsc --noEmit   # types
npx expo export --platform android   # the app bundles
```
