import * as Location from 'expo-location';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SignedIn } from '@/components/signed-in';
import { Button, Loading, styles as ui } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C, S } from '@/lib/theme';
import type { Address } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function AddressScreen() {
  return (
    <SignedIn>
      <AddressForm />
    </SignedIn>
  );
}

// Add or change the HOME or OFFICE address (POST /addresses replaces that label). The location pin
// lets the website work out a distance-based delivery fee.
function AddressForm() {
  const { label: raw } = useLocalSearchParams<{ label?: string }>();
  const label = raw === 'OFFICE' ? 'OFFICE' : 'HOME';
  const { t } = useI18n();
  const { user } = useAuth();
  const r = useApi<{ addresses: Address[] }>('/addresses');
  const [f, setF] = useState({ recipient: '', phone: '', city: '', district: '', details: '' });
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!r.data || loaded) return;
    const a = r.data.addresses.find((x) => x.label === label);
    setF(
      a
        ? { recipient: a.recipient, phone: a.phone, city: a.city, district: a.district, details: a.details }
        : { recipient: user?.name ?? '', phone: user?.phone ?? '', city: '', district: '', details: '' },
    );
    setPin(a && a.lat !== null && a.lng !== null ? { lat: a.lat, lng: a.lng } : null);
    setLoaded(true);
  }, [r.data, loaded, label, user]);

  if (!loaded) return <Loading />;

  const locate = async () => {
    setErr('');
    setLocating(true);
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (!p.granted) return setErr(t('locationDenied'));
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      setErr(t('errGeneric'));
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    setErr('');
    setBusy(true);
    try {
      await api('/addresses', { method: 'POST', body: { label, ...f, lat: pin?.lat ?? '', lng: pin?.lng ?? '' } });
      router.back();
    } catch (e) {
      setErr(e instanceof ApiError && e.status === 400 ? e.message : t('errGeneric'));
      setBusy(false);
    }
  };

  const field = (key: keyof typeof f, title: string, extra: Partial<React.ComponentProps<typeof TextInput>> = {}) => (
    <View style={{ gap: S.xs }}>
      <Text style={s.label}>{title}</Text>
      <TextInput value={f[key]} onChangeText={(v) => setF({ ...f, [key]: v })} placeholderTextColor={C.muted} style={ui.input} {...extra} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: t(label) }} />
      <ScrollView contentContainerStyle={{ padding: S.l, gap: S.m, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {field('recipient', t('recipient'), { textContentType: 'name', maxLength: 80 })}
        {field('phone', t('phoneNumber'), { keyboardType: 'phone-pad', maxLength: 30 })}
        {field('city', t('city'), { maxLength: 60 })}
        {field('district', t('district'), { maxLength: 60 })}
        {field('details', t('addressDetails'), { multiline: true, maxLength: 300, style: [ui.input, { height: 80, paddingTop: S.m }] })}
        <View style={[ui.card, { gap: S.s }]}>
          <Text style={{ color: pin ? C.accent : C.muted, fontWeight: '600' }}>{pin ? t('mapSet') + ' ✓' : t('mapMissing')}</Text>
          <Button title={t('mapUseLocation')} kind="outline" onPress={locate} busy={locating} />
        </View>
        {err ? <Text style={ui.error}>{err}</Text> : null}
        <Button
          title={t('save')}
          onPress={save}
          busy={busy}
          disabled={!f.recipient.trim() || f.phone.trim().length < 6 || !f.city.trim()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: C.text },
});
