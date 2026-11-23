import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SignedIn } from '@/components/signed-in';
import { ErrorView, Loading, styles as ui } from '@/components/ui';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { C, R, S } from '@/lib/theme';
import type { Address } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function AddressesScreen() {
  return (
    <SignedIn>
      <Addresses />
    </SignedIn>
  );
}

// One HOME and one OFFICE address at most (like the website); saving a label replaces it.
function Addresses() {
  const { t } = useI18n();
  const r = useApi<{ addresses: Address[] }>('/addresses');
  const { reload } = r;
  useFocusEffect(useCallback(() => reload(), [reload]));

  if (r.error && !r.data) return <ErrorView error={r.error} onRetry={r.reload} />;
  if (!r.data) return <Loading />;
  const byLabel = (l: 'HOME' | 'OFFICE') => r.data!.addresses.find((a) => a.label === l);

  const remove = (a: Address) =>
    Alert.alert(t('remove'), `${t(a.label)} · ${a.recipient}`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('remove'),
        style: 'destructive',
        onPress: async () => {
          await api(`/addresses/${a.id}`, { method: 'DELETE' }).catch(() => {});
          r.reload();
        },
      },
    ]);

  return (
    <ScrollView style={ui.screen} contentContainerStyle={{ padding: S.l, gap: S.m }}>
      <Text style={s.muted}>{t('addressesSub')}</Text>
      {(['HOME', 'OFFICE'] as const).map((label) => {
        const a = byLabel(label);
        return (
          <View key={label} style={s.card}>
            <View style={s.row}>
              <Text style={s.title}>{t(label)}</Text>
              <Pressable onPress={() => router.push({ pathname: '/address', params: { label } })} hitSlop={8}>
                <Text style={ui.link}>{a ? t('edit') : '+ ' + t('addAddress')}</Text>
              </Pressable>
            </View>
            {a ? (
              <>
                <Text style={ui.body}>
                  {a.recipient} · {a.phone}
                </Text>
                <Text style={s.muted}>{[a.details, a.district, a.city].filter(Boolean).join(', ')}</Text>
                <Text style={s.muted}>{a.lat !== null ? t('mapSet') : t('mapMissing')}</Text>
                <Pressable onPress={() => remove(a)} hitSlop={8} style={{ alignSelf: 'flex-start', marginTop: S.xs }}>
                  <Text style={{ color: C.red }}>{t('remove')}</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.m, padding: S.l, gap: S.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: C.text },
  muted: { fontSize: 13, color: C.muted },
});
