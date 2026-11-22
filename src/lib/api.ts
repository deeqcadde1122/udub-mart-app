import Constants from 'expo-constants';

import type { Lang } from './types';

// The one way the app talks to the website (udub-store docs/MOBILE_API.md). The website is the
// "brain": prices, totals and rules always come from it, never from the app.
export const API_URL: string = (
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  'https://e.udub.so/api/mobile'
).replace(/\/$/, '');

let token: string | null = null;
let lang: Lang = 'en';
let onUnauthorized: (() => void) | null = null;

export function setApiToken(t: string | null) {
  token = t;
}
export function setApiLang(l: Lang) {
  lang = l;
}
/** Called when the server says the token no longer works (signed out elsewhere, account deleted). */
export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public reasons: string[] = [],
  ) {
    super(message);
  }
}

type Opts = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; signal?: AbortSignal };

export async function api<T>(path: string, opts: Opts = {}): Promise<T> {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${API_URL}${path}${token ? '' : `${sep}lang=${lang}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? 'GET',
      signal: opts.signal,
      headers: {
        accept: 'application/json',
        ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e;
    throw new ApiError(0, 'network', 'network');
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: { code: string; message: string; reasons?: string[] } }) | null;
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    const err = data?.error;
    throw new ApiError(res.status, err?.code ?? 'http', err?.message ?? `HTTP ${res.status}`, err?.reasons ?? []);
  }
  return data as T;
}
