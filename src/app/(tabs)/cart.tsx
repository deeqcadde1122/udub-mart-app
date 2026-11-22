import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Empty, ErrorView, Loading, styles as ui } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { saveCart, toLines } from '@/lib/cart';
import { useI18n } from '@/lib/i18n';
import { errorKey } from '@/lib/links';
import { fmtMoney, fmtMoney2 } from '@/lib/money';
import { ApiError } from '@/lib/api';
import { C, R, S } from '@/lib/theme';
import type { Cart, CartLine } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function CartScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const r = useApi<{ cart: Cart }>(user ? '/cart' : null);
  const [busy, setBusy] = useState(false);

  // Coming back to the tab (e.g. after "Add to Cart") shows the latest cart.
  const { reload } = r;
  useFocusEffect(
    useCallback(() => {
      if (user) reload();
    }, [user, reload]),
  );

  if (!user) {
    return (
      <SafeAreaView style={ui.screen}>
        <Empty title={t('myCart')} text={t('signInWhy')}>
          <Button title={t('signIn')} onPress={() => router.push('/login')} style={{ marginTop: S.xl, alignSelf: 'stretch' }} />
        </Empty>
      </SafeAreaView>
    );
  }

  const change = async (line: CartLine, qty: number) => {
    if (!r.data || busy) return;
    setBusy(true);
    try {
      const lines = toLines(r.data.cart)
        .map((l, i) => (r.data!.cart.lines[i].key === line.key ? { ...l, qty } : l))
        .filter((l) => l.qty > 0);
      r.setData({ cart: await saveCart(lines) });
    } catch (e) {
      Alert.alert(t(errorKey(e instanceof ApiError ? e.code : 'unknown')));
    } finally {
      setBusy(false);
    }
  };

  const cart = r.data?.cart;
  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <Text style={[ui.h1, { paddingHorizontal: S.l, paddingVertical: S.m }]}>{t('myCart')}</Text>
      {r.error && !cart ? (
        <ErrorView error={r.error} onRetry={r.reload} />
      ) : !cart ? (
        <Loading />
      ) : !cart.lines.length ? (
        <Empty title={t('cartEmpty')} />
      ) : (
        <FlatList
          data={cart.lines}
          keyExtractor={(l) => l.key}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingHorizontal: S.l, gap: S.m, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={[s.line, !item.available && { opacity: 0.5 }]}>
              <Pressable onPress={() => router.push({ pathname: '/p/[slug]', params: { slug: item.slug } })}>
                <Image source={item.image ?? undefined} style={s.img} contentFit="cover" />
              </Pressable>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.name} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.size || item.color ? <Text style={s.opt}>{[item.color, item.size].filter(Boolean).join(' · ')}</Text> : null}
                {!item.available ? <Text style={[s.opt, { color: C.red }]}>{t('outOfStock')}</Text> : null}
                <View style={s.row}>
                  <Text style={s.price}>{fmtMoney(item.lineTotal)}</Text>
                  <View style={s.qty}>
                    <Pressable onPress={() => change(item, item.qty - 1)} hitSlop={8} style={s.qtyBtn}>
                      <Text style={s.qtyBtnText}>−</Text>
                    </Pressable>
                    <Text style={s.qtyText}>{item.qty}</Text>
                    <Pressable onPress={() => change(item, Math.min(20, item.qty + 1))} hitSlop={8} style={s.qtyBtn}>
                      <Text style={s.qtyBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          )}
          ListFooterComponent={
            <View style={[ui.card, { gap: S.s, marginTop: S.s }]}>
              <Row label={t('subTotal')} value={fmtMoney2(cart.subtotal)} />
              {cart.discount ? <Row label={t('discount')} value={`-${fmtMoney2(cart.discount)}`} /> : null}
              <Row label={t('deliveryFee')} value={fmtMoney2(cart.deliveryFee)} />
              <Row label={t('total')} value={fmtMoney2(cart.total)} bold />
              {cart.freeDeliveryFrom && cart.subtotal < cart.freeDeliveryFrom ? (
                <Text style={s.opt}>{t('freeFrom', { amount: fmtMoney(cart.freeDeliveryFrom) })}</Text>
              ) : null}
              <Button title={t('checkout')} onPress={() => {}} disabled style={{ marginTop: S.s }} />
              <Text style={[ui.muted, { fontSize: 12 }]}>{t('checkoutSoon')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={s.row}>
      <Text style={[s.opt, bold && s.bold]}>{label}</Text>
      <Text style={[s.opt, bold && s.bold]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  line: { flexDirection: 'row', gap: S.m, backgroundColor: C.card, borderRadius: R.m, padding: S.s },
  img: { width: 84, height: 84, borderRadius: R.s, backgroundColor: C.line },
  name: { fontSize: 14, color: C.text, fontWeight: '500' },
  opt: { fontSize: 13, color: C.muted },
  bold: { fontSize: 16, color: C.text, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  price: { fontSize: 15, fontWeight: '800', color: C.text },
  qty: { flexDirection: 'row', alignItems: 'center', gap: S.s },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 18, color: C.text },
  qtyText: { minWidth: 18, textAlign: 'center', fontSize: 15, fontWeight: '600' },
});
