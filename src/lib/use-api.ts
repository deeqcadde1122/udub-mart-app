import { useCallback, useEffect, useState } from 'react';

import { api, ApiError } from './api';
import { useAuth } from './auth';
import { useI18n } from './i18n';

type State<T> = { data: T | null; error: ApiError | null; loading: boolean };

/** GET a path from the mobile API; reloads when the language or the signed-in person changes.
 *  `path = null` waits (e.g. until signed in). */
export function useApi<T>(path: string | null) {
  const { lang } = useI18n();
  const { token } = useAuth();
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: !!path });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!path) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    const ac = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api<T>(path, { signal: ac.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((e: unknown) => {
        if ((e as Error)?.name === 'AbortError') return;
        setState((s) => ({ ...s, error: e instanceof ApiError ? e : new ApiError(0, 'unknown', String(e)), loading: false }));
      });
    return () => ac.abort();
  }, [path, lang, token, n]);

  const reload = useCallback(() => setN((x) => x + 1), []);
  const setData = useCallback((data: T) => setState({ data, error: null, loading: false }), []);
  return { ...state, reload, setData };
}
