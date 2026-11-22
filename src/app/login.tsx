import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput } from 'react-native';

import { Button, styles as ui } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { errorKey } from '@/lib/links';
import { C, S } from '@/lib/theme';

// Sign in, step 1: the phone number → a 6-digit code by SMS/WhatsApp (POST /auth/code).
export default function LoginScreen() {
  const { t } = useI18n();
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const send = async () => {
    setErr('');
    setBusy(true);
    try {
      const r = await api<{ sent: boolean; phone: string; resendAfterSeconds: number }>('/auth/code', { method: 'POST', body: { phone } });
      router.push({ pathname: '/verify', params: { phone: r.phone } });
    } catch (e) {
      const code = e instanceof ApiError ? e.code : 'unknown';
      setErr(t(code === 'limit' ? 'errLimit' : errorKey(code)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: S.xl, gap: S.m }} keyboardShouldPersistTaps="handled">
        <Image source={require('@/assets/images/icon.png')} style={{ width: 72, height: 72, alignSelf: 'center' }} />
        <Text style={[ui.muted, { marginBottom: S.l }]}>{t('welcomeSub')}</Text>
        <Text style={{ color: C.text, fontWeight: '600' }}>{t('phoneNumber')}</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder={t('phoneHint')}
          placeholderTextColor={C.muted}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          autoFocus
          style={ui.input}
          onSubmitEditing={send}
        />
        {err ? <Text style={ui.error}>{err}</Text> : null}
        <Button
          title={t('sendCode')}
          onPress={send}
          busy={busy}
          disabled={phone.replace(/\D/g, '').length < 7}
          style={{ marginTop: S.s }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
