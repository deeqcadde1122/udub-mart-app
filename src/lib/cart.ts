import { api } from './api';
import type { Cart } from './types';

// The app's cart is the account's saved cart on the website (PUT /cart replaces it whole), so
// adding a line = read it, merge, write it back. Prices always come back from the server.

export type LineIn = { productId: string; qty: number; size: string; color: string };

export const toLines = (c: Cart): LineIn[] => c.lines.map((l) => ({ productId: l.productId, qty: l.qty, size: l.size, color: l.color }));

export async function addToCart(line: LineIn): Promise<Cart> {
  const { cart } = await api<{ cart: Cart }>('/cart');
  const lines = toLines(cart);
  const same = lines.find((l) => l.productId === line.productId && l.size === line.size && l.color === line.color);
  if (same) same.qty = Math.min(20, same.qty + line.qty);
  else lines.push(line);
  return saveCart(lines.slice(0, 30));
}

export async function saveCart(lines: LineIn[]): Promise<Cart> {
  const r = await api<{ cart: Cart }>('/cart', { method: 'PUT', body: { lines } });
  return r.cart;
}
