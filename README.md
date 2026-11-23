# Udub Mart — iPhone & Android app

The Udub Mart shopping app. One codebase for iPhone and Android, built with **Expo (SDK 58)**,
**Expo Router** and TypeScript. App ID: `so.udub.mart`.

The app has no database or prices of its own: everything comes from the website's mobile API
at `https://e.udub.so/api/mobile/` (repo `udub-store`, see its `docs/MOBILE_API.md`).

## What's in it

- **Sign-in** with phone number + 6-digit code (new accounts are asked for their name)
- **Home**: search, Showcase, categories, deals, recommended, new arrivals, stores
- **Categories**, **search results / product lists** (category, store, deals) with "did you mean"
- **Product page**: photos, price, options (colour/size, incl. imported-product variants),
  quantity, description, how to use, ingredients, reviews, questions, similar products, Add to Cart
- **Cart**: the account's saved cart (same as the website), change quantity, totals
- **Checkout**: delivery or pickup, address, payment method (automatic mobile money, manual
  mobile money, cash on delivery, card), wallet balance, promo code, note
- **Orders**: list and detail — pay with automatic mobile money (PIN on the phone), the store's
  number for manual mobile money, the card payment page, the **delivery code** while a shipment
  is on its way, items, money and timeline
- **Addresses** (Home/Office) with "Use my location" for the delivery pin
- **Wishlist** (heart on the product page), **Messages** (chat with a store, messages from
  Udub, "Message the seller"), **Notifications**, **Wallet** (balance, points, invite link)
- **Account**: menu with unread counts, Somali/English, help/privacy/terms, sign out, delete account

Not yet: push notifications, Google sign-in, returns and reviews from the app.

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
