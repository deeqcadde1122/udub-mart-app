import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput } from 'react-native';

import { Button, styles as ui } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C, S } from '@/lib/theme';
import { closeSignIn } from '@/lib/sign-in';
import type { User } from '@/lib/types';

// A new account has no name yet: ask once, then PATCH /me.
export default function NameScreen() {
  const { t } = useI18n();
  const { setUser } = useAuth();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setErr('');
    setBusy(true);
    try {
      const r = await api<{ user: User }>('/me', { method: 'PATCH', body: { name: name.trim() } });
      setUser(r.user);
      closeSignIn();
    } catch {
      setErr(t('errGeneric'));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: S.xl, gap: S.m }} keyboardShouldPersistTaps="handled">
        <Text style={ui.h2}>{t('nameIntro')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('yourName')}
          placeholderTextColor={C.muted}
          textContentType="name"
          autoComplete="name"
          autoFocus
          maxLength={60}
          style={ui.input}
          onSubmitEditing={save}
        />
        {err ? <Text style={ui.error}>{err}</Text> : null}
        <Button title={t('continue')} onPress={save} busy={busy} disabled={name.trim().length < 2} style={{ marginTop: S.s }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
