import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput } from 'react-native';

import { Button, styles as ui } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { deviceName, useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { errorKey } from '@/lib/links';
import { closeSignIn } from '@/lib/sign-in';
import { C, S } from '@/lib/theme';
import type { User } from '@/lib/types';

// Sign in, step 2: the 6-digit code → a token for this device (POST /auth/verify).
export default function VerifyScreen() {
  // phone: the code came by phone sign-in; ticket: the second step after Google (two-step sign-in).
  const { phone, ticket } = useLocalSearchParams<{ phone?: string; ticket?: string }>();
  const { t, lang } = useI18n();
  const { signedIn } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [wait, setWait] = useState(60);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const verify = async (c = code) => {
    if (c.length !== 6 || busy) return;
    setErr('');
    setBusy(true);
    try {
      const r = await api<{ token: string; user: User; needsName: boolean }>('/auth/verify', {
        method: 'POST',
        body: { ...(ticket ? { ticket } : { phone }), code: c, lang, device: deviceName() },
      });
      signedIn(r.token, r.user);
      if (r.needsName) router.replace('/name');
      else closeSignIn();
    } catch (e) {
      setErr(t(errorKey(e instanceof ApiError ? e.code : 'unknown')));
      setBusy(false);
    }
  };

  const resend = async () => {
    setErr('');
    try {
      await api('/auth/code', { method: 'POST', body: { phone } });
      setWait(60);
    } catch (e) {
      const c = e instanceof ApiError ? e.code : 'unknown';
      setErr(t(c === 'limit' ? 'errLimit' : errorKey(c)));
    }
  };

  return (
    <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: S.xl, gap: S.m }} keyboardShouldPersistTaps="handled">
        <Text style={ui.h2}>{t('enterCode')}</Text>
        <Text style={{ color: C.muted }}>{ticket ? t('twoStepNote') : t('codeSentTo', { phone: `+${phone}` })}</Text>
        <TextInput
          value={code}
          onChangeText={(v) => {
            const c = v.replace(/\D/g, '').slice(0, 6);
            setCode(c);
            if (c.length === 6) verify(c);
          }}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          autoFocus
          maxLength={6}
          style={[ui.input, { fontSize: 26, letterSpacing: 10, textAlign: 'center' }]}
        />
        {err ? <Text style={ui.error}>{err}</Text> : null}
        <Button title={t('verify')} onPress={() => verify()} busy={busy} disabled={code.length !== 6} style={{ marginTop: S.s }} />
        {phone ? (
          <Pressable onPress={resend} disabled={wait > 0} style={{ alignSelf: 'center', padding: S.s }}>
            <Text style={{ color: wait > 0 ? C.muted : C.accent, fontWeight: '600' }}>
              {wait > 0 ? t('resendIn', { s: wait }) : t('resend')}
            </Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => router.back()} style={{ alignSelf: 'center', padding: S.s }}>
          <Text style={{ color: C.accent }}>{t('changeNumber')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
