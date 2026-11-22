import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { setApiLang } from './api';
import { DICT, type Key } from './dict';
import { getItem, setItem } from './storage';
import type { Lang } from './types';

type T = (key: Key, vars?: Record<string, string | number>) => string;
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: T; ready: boolean };

const I18n = createContext<Ctx | null>(null);

export function makeT(lang: Lang): T {
  return (key, vars) => {
    let s: string = DICT[lang][key] ?? DICT.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}

/** The app's language: English by default (like the website), Somali when chosen. A signed-in
 *  person's language comes from their account (see auth.tsx). */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getItem('lang').then((v) => {
      if (v === 'so' || v === 'en') {
        setLangState(v);
        setApiLang(v);
      }
      setReady(true);
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    setApiLang(l);
    setLangState(l);
    setItem('lang', l);
  }, []);

  const value = useMemo(() => ({ lang, setLang, t: makeT(lang), ready }), [lang, setLang, ready]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export function useI18n() {
  const c = useContext(I18n);
  if (!c) throw new Error('useI18n outside I18nProvider');
  return c;
}
