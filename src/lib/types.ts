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
};
