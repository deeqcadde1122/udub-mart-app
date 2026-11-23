// The shapes the website's mobile API returns (udub-store docs/MOBILE_API.md, lib/mobile/shapes.ts).
// Money is in cents; images are full https addresses (or null).

export type Lang = 'so' | 'en';

export type User = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  lang: Lang;
  role: string;
  photo: string | null;
  coverPhoto: string | null;
  birthDate: string | null;
  gender: string | null;
  notifyOn: boolean;
  walletBalance: number;
  points: number;
  referralCode: string | null;
  googleLinked: boolean;
  twoStep: boolean;
};

export type StoreRef = { name: string; slug: string };

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  short: string;
  price: number;
  oldPrice: number | null;
  image: string | null;
  sizes: string[];
  colors: string[];
  needsChoice: boolean;
  inStock: boolean;
  rating: number | null;
  ratingCount: number;
  store: StoreRef;
  liked?: boolean;
};

export type Store = {
  id: string;
  slug: string;
  name: string;
  about: string;
  logo: string | null;
  cover: string | null;
  official: boolean;
  rating: number | null;
  ratingCount: number;
  productCount?: number;
};

export type Category = { id: string; slug: string; name: string; image?: string | null };

export type Slide = {
  id: string;
  title: string;
  subtitle: string;
  link: string;
  image: string | null;
  cutout: boolean;
  products: { id: string; slug: string; name: string; price: number; image: string | null }[];
};

export type Home = {
  showcase: Slide[];
  categories: Category[];
  deals: ProductCard[];
  recommended: ProductCard[];
  newArrivals: ProductCard[];
  stores: Store[];
  referral: boolean;
};

export type Config = {
  apiVersion: number;
  storeName: string;
  tagline: string;
  currency: string;
  freeDeliveryFrom: number | null;
  whatsapp: string | null;
  googleSignIn: boolean;
  links: { privacy: string; terms: string; help: string; deleteAccount: string };
  pickup: { enabled: boolean; address: string };
  returnDays: number;
  payMethods: PayMethod[];
};

/** auto = paid from the app (PIN on the phone); mobileMoney = ask the number they pay from. */
export type PayMethod = { id: string; label: string; auto: boolean; mobileMoney: boolean };

export type Address = {
  id: string;
  label: 'HOME' | 'OFFICE';
  recipient: string;
  phone: string;
  city: string;
  district: string;
  details: string;
  lat: number | null;
  lng: number | null;
};

export type OrderStatus = 'NEW' | 'PAID' | 'ORDERED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type OrderSummary = {
  trackingId: string;
  number: string;
  status: OrderStatus;
  total: number;
  toPay: number;
  date: string | null;
  itemCount: number;
  images: (string | null)[];
};

export type OrderDetail = {
  trackingId: string;
  number: string;
  status: OrderStatus;
  date: string | null;
  fulfilment: 'SHIP' | 'PICKUP';
  shipTo: { name: string; phone: string; city: string; district: string; details: string };
  payMethod: { id: string; label: string };
  paid: boolean;
  payment: { payNow: boolean; payer: string | null; sendTo: string | null; cardLink: string | null };
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  walletPaid: number;
  toPay: number;
  note: string;
  items: {
    id: string;
    productId: string;
    name: string;
    image: string | null;
    qty: number;
    size: string;
    color: string;
    unitPrice: number;
    lineTotal: number;
    shipmentId: string | null;
    returnStatus: string | null;
    /** Received: may rate (and re-rate) it. */
    canReview: boolean;
    myRating: number | null;
    return: ReturnInfo;
  }[];
  replacementEnabled: boolean;
  shipments: {
    id: string;
    storeName: string;
    status: OrderStatus;
    deliveredBy: 'udub' | 'store';
    deliveryFee: number;
    deliveryTime: string;
    deliveredAt: string | null;
    deliveryCode: string | null;
  }[];
  history: { status: OrderStatus; at: string | null }[];
  webUrl: string;
};

export type Notification = {
  id: string;
  kind: string;
  orderStatus: string | null;
  stage: string | null;
  title: string;
  body: string;
  order: { trackingId: string; number: string } | null;
  link: string | null;
  read: boolean;
  at: string | null;
};

export type InboxItem = {
  id: string;
  kind: 'chat' | 'udub' | 'security';
  name: string;
  preview: string;
  at: string | null;
  unread: boolean;
  avatar: string | null;
};

export type ChatMessage = { id: string; body: string; mine: boolean; at: string | null };

export type Conversation =
  | { kind: 'chat'; store: StoreRef; messages: ChatMessage[] }
  | { kind: 'udub' | 'security'; title: string; body: string; at: string | null; device: string | null };

export type Wallet = {
  balance: number;
  points: number;
  entries: { id: string; amount: number; kind: string; at: string | null }[];
  referral: { code: string; link: string } | null;
};

export type ProductList = {
  products: ProductCard[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  didYouMean: string | null;
  similarOnly: boolean;
};

export type Variant = { size: string; color: string; inStock: boolean; price: number | null };

export type Review = {
  id: string;
  rating: number;
  text: string;
  photos: (string | null)[];
  date: string | null;
  name: string | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  short: string;
  description: string;
  howToUse: string;
  brand: string;
  keyIngredients: string;
  ingredients: string;
  price: number;
  oldPrice: number | null;
  images: (string | null)[];
  sizes: string[];
  colors: string[];
  optionName: string | null;
  variants: Variant[];
  inStock: boolean;
  rating: number | null;
  ratingCount: number;
  liked: boolean;
  category: { slug: string; name: string };
  store: Store;
  reviews: Review[];
  questions: { id: string; question: string; answer: string; answeredAt: string | null }[];
  webUrl: string;
};

export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  size: string;
  color: string;
  qty: number;
  unitPrice: number;
  oldUnitPrice: number | null;
  lineTotal: number;
  available: boolean;
  store: StoreRef;
};

export type Cart = {
  lines: CartLine[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  count: number;
  freeDeliveryFrom: number | null;
  pickupAllowed: boolean;
  promo: { code: string; ok: boolean } | null;
  /** flat | distance | needsPin | outside | pickup — needsPin/outside block checkout */
  delivery: string;
  shipments: { storeName: string; storeSlug: string; deliveredBy: 'udub' | 'store'; fee: number; time: string; subtotal: number }[];
};

/** What the customer may do about returning one order line (website lib/returns.ts). */
export type ReturnInfo =
  | { state: 'off' }
  | { state: 'open' | 'closed'; until: string | null }
  | { state: 'requested'; status: 'REQUESTED' | 'APPROVED' | 'REJECTED'; kind: 'RETURN' | 'REPLACE'; note: string };
