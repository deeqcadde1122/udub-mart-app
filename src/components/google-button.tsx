import Constants from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform, Text } from 'react-native';

import { Button, styles as ui } from '@/components/ui';
import { api } from '@/lib/api';
import { deviceName, useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { closeSignIn } from '@/lib/sign-in';
import type { User } from '@/lib/types';

WebBrowser.maybeCompleteAuthSession();

type Ids = { iosClientId?: string; androidClientId?: string; webClientId?: string };
const ids: Ids = (Constants.expoConfig?.extra?.google as Ids | undefined) ?? {};

/** Google needs its own client id for each platform (Google Cloud → Credentials), set in app.json
 *  extra.google — and the website must list them in GOOGLE_MOBILE_CLIENT_IDS. */
export const googleConfigured = !!(Platform.OS === 'ios'
  ? ids.iosClientId
  : Platform.OS === 'android'
    ? ids.androidClientId
    : ids.webClientId);

// "Continue with Google": Google's sign-in page gives an ID token, the website checks it
// (POST /auth/google) and answers with our own token — or asks for the phone code (two-step).
export function GoogleButton() {
  const { t, lang } = useI18n();
  const { signedIn } = useAuth();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: ids.iosClientId || undefined,
    androidClientId: ids.androidClientId || undefined,
    webClientId: ids.webClientId || undefined,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (response?.type !== 'success') {
      if (response?.type === 'error') setErr(t('errGoogle'));
      return;
    }
    const idToken = response.params.id_token;
    if (!idToken) return setErr(t('errGoogle'));
    setBusy(true);
    api<{ token?: string; user?: User; needsName?: boolean; twoStep?: boolean; ticket?: string }>('/auth/google', {
      method: 'POST',
      body: { idToken, lang, device: deviceName() },
    })
      .then((r) => {
        if (r.twoStep && r.ticket) return router.push({ pathname: '/verify', params: { ticket: r.ticket } });
        if (!r.token || !r.user) return setErr(t('errGoogle'));
        signedIn(r.token, r.user);
        if (r.needsName) router.replace('/name');
        else closeSignIn();
      })
      .catch(() => setErr(t('errGoogle')))
      .finally(() => setBusy(false));
  }, [response, lang, signedIn, t]);

  return (
    <>
      <Button title={t('continueGoogle')} kind="outline" onPress={() => promptAsync()} disabled={!request} busy={busy} />
      {err ? <Text style={ui.error}>{err}</Text> : null}
    </>
  );
}
