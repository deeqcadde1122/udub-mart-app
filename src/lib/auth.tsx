import * as Device from 'expo-device';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, setApiToken, setOnUnauthorized } from './api';
import { useI18n } from './i18n';
import { getItem, setItem } from './storage';
import type { Lang, User } from './types';

// Who is signed in. The token (180 days, one device session on the website) is kept in secure
// storage; the user comes fresh from GET /me at every start, so a sign-out on the website
// ("Security & devices") is noticed straight away.

type Ctx = {
  ready: boolean;
  token: string | null;
  user: User | null;
  signedIn: (token: string, user: User) => void;
  setUser: (u: User) => void;
  signOut: () => Promise<void>;
  /** Forget the session locally (the server already ended it, e.g. account deleted). */
  forget: () => void;
};

const Auth = createContext<Ctx | null>(null);
const KEY = 'token';

export const deviceName = () => [Device.manufacturer, Device.modelName].filter(Boolean).join(' ').slice(0, 80) || undefined;

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setLang } = useI18n();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserState] = useState<User | null>(null);

  const forget = useCallback(() => {
    setApiToken(null);
    setToken(null);
    setUserState(null);
    setItem(KEY, null);
  }, []);

  const setUser = useCallback(
    (u: User) => {
      setUserState(u);
      setLang(u.lang as Lang);
    },
    [setLang],
  );

  useEffect(() => {
    setOnUnauthorized(forget);
    (async () => {
      const t = await getItem(KEY);
      if (t) {
        setApiToken(t);
        setToken(t);
        try {
          const r = await api<{ user: User }>('/me');
          setUser(r.user);
        } catch {
          // 401 already signed us out (onUnauthorized); offline keeps the token for later.
        }
      }
      setReady(true);
    })();
    return () => setOnUnauthorized(null);
  }, [forget, setUser]);

  const signedIn = useCallback(
    (t: string, u: User) => {
      setApiToken(t);
      setToken(t);
      setItem(KEY, t);
      setUser(u);
    },
    [setUser],
  );

  const signOut = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    forget();
  }, [forget]);

  const value = useMemo(
    () => ({ ready, token, user, signedIn, setUser, signOut, forget }),
    [ready, token, user, signedIn, setUser, signOut, forget],
  );
  return <Auth.Provider value={value}>{children}</Auth.Provider>;
}

export function useAuth() {
  const c = useContext(Auth);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
}
