import type { Href } from 'expo-router';

// Showcase slides and notifications link to website paths; each maps to an app screen here.
// Anything the app doesn't have a screen for yet opens the product list.
export function appHref(path: string): Href {
  const [p, qs = ''] = path.split('?');
  const parts = p.split('/').filter(Boolean);
  const q = new URLSearchParams(qs);
  const [kind, slug] = parts;
  if (kind === 'p' && slug) return { pathname: '/p/[slug]', params: { slug } };
  if (kind === 'c' && slug) return { pathname: '/products', params: { category: slug } };
  if (kind === 's' && slug) return { pathname: '/products', params: { store: slug } };
  if (kind === 'deals') return { pathname: '/products', params: { deals: '1' } };
  if (kind === 'search') return { pathname: '/products', params: { q: q.get('q') ?? '' } };
  return { pathname: '/products', params: {} };
}

export function errorKey(code: string) {
  if (code === 'network') return 'errNetwork' as const;
  if (code === 'bad_phone') return 'errPhone' as const;
  if (code === 'bad_code') return 'errCode' as const;
  if (code === 'send_failed') return 'errSend' as const;
  if (code === 'limit') return 'errTooFast' as const;
  return 'errGeneric' as const;
}
