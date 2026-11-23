import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { SignedIn } from '@/components/signed-in';
import { Empty, ErrorView, Loading, styles as ui } from '@/components/ui';
import { fmtDate } from '@/lib/dates';
import type { Key } from '@/lib/dict';
import { useI18n } from '@/lib/i18n';
import { fmtMoney2 } from '@/lib/money';
import { C, R, S } from '@/lib/theme';
import type { OrderSummary } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function OrdersScreen() {
  return (
    <SignedIn>
      <Orders />
    </SignedIn>
  );
}

function Orders() {
  const { t, lang } = useI18n();
  const r = useApi<{ orders: OrderSummary[] }>('/orders');
  const { reload } = r;
  useFocusEffect(useCallback(() => reload(), [reload]));

  if (r.error && !r.data) return <ErrorView error={r.error} onRetry={r.reload} />;
  if (!r.data) return <Loading />;
  return (
    <FlatList
      style={ui.screen}
      data={r.data.orders}
      keyExtractor={(o) => o.trackingId}
      contentContainerStyle={{ padding: S.l, gap: S.m }}
      refreshControl={<RefreshControl refreshing={r.loading} onRefresh={r.reload} tintColor={C.accent} />}
      ListEmptyComponent={<Empty title={t('noOrders')} />}
      renderItem={({ item: o }) => (
        <Pressable onPress={() => router.push({ pathname: '/order/[trackingId]', params: { trackingId: o.trackingId } })} style={s.card}>
          <View style={s.row}>
            <Text style={s.title}>{o.number}</Text>
            <Text style={s.status}>{t(`st_${o.status}` as Key)}</Text>
          </View>
          <View style={s.imgs}>
            {o.images.slice(0, 4).map((src, i) => (
              <Image key={i} source={src ?? undefined} style={s.img} />
            ))}
          </View>
          <View style={s.row}>
            <Text style={s.muted}>
              {fmtDate(o.date, lang)} · {t('itemsN', { n: o.itemCount })}
            </Text>
            <Text style={s.title}>{fmtMoney2(o.total)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.m, padding: S.m, gap: S.s },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: C.text },
  status: { fontSize: 13, fontWeight: '600', color: C.accent },
  muted: { fontSize: 13, color: C.muted },
  imgs: { flexDirection: 'row', gap: S.s },
  img: { width: 52, height: 52, borderRadius: R.s, backgroundColor: C.line },
});
