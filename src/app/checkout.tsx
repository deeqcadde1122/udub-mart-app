import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { SignedIn } from '@/components/signed-in';
import { Button, ErrorView, Loading, styles as ui } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { errorKey } from '@/lib/links';
import { fmtMoney, fmtMoney2 } from '@/lib/money';
import { C, R, S } from '@/lib/theme';
import type { Address, Cart, Config } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function CheckoutScreen() {
  return (
    <SignedIn>
      <Checkout />
    </SignedIn>
  );
}

// Checkout: every amount comes from GET /cart (the website's quote) for the choices made here;
// POST /checkout places the order with the website's own rules (lib/checkout.ts).
function Checkout() {
  const { t } = useI18n();
  const { user } = useAuth();
  const config = useApi<Config>('/config');
  const addresses = useApi<{ addresses: Address[] }>('/addresses');
  const [fulfilment, setFulfilment] = useState<'SHIP' | 'PICKUP'>('SHIP');
  const [addressId, setAddressId] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [payer, setPayer] = useState(user?.phone ?? '');
  const [note, setNote] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Back from adding/editing an address: show the new list.
  const reloadAddresses = addresses.reload;
  useFocusEffect(useCallback(() => reloadAddresses(), [reloadAddresses]));

  const list = addresses.data?.addresses ?? [];
  useEffect(() => {
    if (list.length && !list.some((a) => a.id === addressId)) setAddressId(list[0].id);
  }, [list, addressId]);
  const methods = config.data?.payMethods ?? [];
  useEffect(() => {
    if (methods.length && !methods.some((m) => m.id === payMethod)) setPayMethod(methods[0].id);
  }, [methods, payMethod]);

  const qs = new URLSearchParams({ fulfilment, ...(fulfilment === 'SHIP' && addressId ? { addressId } : {}), ...(promo ? { promo } : {}) });
  const quote = useApi<{ cart: Cart }>(`/cart?${qs}`);
  const cart = quote.data?.cart;
  const method = methods.find((m) => m.id === payMethod);

  if ((config.error && !config.data) || (quote.error && !cart))
    return (
      <ErrorView
        error={(config.error ?? quote.error)!}
        onRetry={() => {
          config.reload();
          quote.reload();
        }}
      />
    );
  if (!config.data || !cart) return <Loading />;

  const pickupOk = config.data.pickup.enabled && cart.pickupAllowed;
  const blocked = fulfilment === 'SHIP' && (cart.delivery === 'needsPin' || cart.delivery === 'outside');

  const place = async () => {
    setErr('');
    if (fulfilment === 'SHIP' && !addressId) return setErr(t('errAddress'));
    if (!method) return setErr(t('choosePayment'));
    setBusy(true);
    try {
      const r = await api<{ order: { trackingId: string }; payNow: boolean }>('/checkout', {
        method: 'POST',
        body: {
          fulfilment,
          addressId: fulfilment === 'SHIP' ? addressId : '',
          payMethod,
          payerNumber: method.mobileMoney ? payer : '',
          note,
          useWallet,
          ...(promo ? { promoCode: promo } : {}),
        },
      });
      router.replace({ pathname: '/order/[trackingId]', params: { trackingId: r.order.trackingId, placed: '1' } });
    } catch (e) {
      // Checkout errors come back already worded in the customer's language.
      setErr(e instanceof ApiError && e.status === 400 ? e.message : t(errorKey(e instanceof ApiError ? e.code : 'unknown')));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: S.l, gap: S.l, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {pickupOk ? (
          <View style={s.seg}>
            {(['SHIP', 'PICKUP'] as const).map((f) => (
              <Pressable key={f} onPress={() => setFulfilment(f)} style={[s.segItem, fulfilment === f && s.segOn]}>
                <Text style={[s.segText, fulfilment === f && { color: '#fff' }]}>{f === 'SHIP' ? t('ship') : t('pickup')}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={[ui.card, { gap: S.s }]}>
          <Text style={ui.h2}>{fulfilment === 'SHIP' ? t('shipTo') : t('pickupAt')}</Text>
          {fulfilment === 'PICKUP' ? (
            <Text style={ui.body}>{config.data.pickup.address}</Text>
          ) : (
            <>
              {list.map((a) => (
                <Pressable key={a.id} onPress={() => setAddressId(a.id)} style={[s.choice, a.id === addressId && s.choiceOn]}>
                  <Text style={s.choiceTitle}>
                    {t(a.label)} · {a.recipient}
                  </Text>
                  <Text style={s.muted}>{[a.details, a.district, a.city].filter(Boolean).join(', ')}</Text>
                  <Text style={s.muted}>{a.lat !== null ? t('mapSet') : t('mapMissing')}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => router.push('/addresses')} hitSlop={8}>
                <Text style={ui.link}>{list.length ? t('addresses') + ' ›' : '+ ' + t('addAddress')}</Text>
              </Pressable>
              {blocked ? <Text style={ui.error}>{cart.delivery === 'needsPin' ? t('errPin') : t('errOutside')}</Text> : null}
            </>
          )}
        </View>

        <View style={[ui.card, { gap: S.s }]}>
          <Text style={ui.h2}>{t('payment')}</Text>
          {methods.map((m) => (
            <Pressable key={m.id} onPress={() => setPayMethod(m.id)} style={[s.choice, m.id === payMethod && s.choiceOn]}>
              <Text style={s.choiceTitle}>{m.label}</Text>
            </Pressable>
          ))}
          {method?.mobileMoney ? (
            <>
              <Text style={s.label}>{method.auto ? t('payPhone') : t('paidFrom')}</Text>
              <TextInput
                value={payer}
                onChangeText={setPayer}
                keyboardType="phone-pad"
                placeholder="61 5123456"
                placeholderTextColor={C.muted}
                style={ui.input}
              />
              <Text style={s.muted}>{method.auto ? t('autoPayNote') : t('manualConfirm')}</Text>
            </>
          ) : method?.id === 'CARD' ? (
            <Text style={s.muted}>{t('cardNote')}</Text>
          ) : null}
          {user && user.walletBalance > 0 ? (
            <View style={s.row}>
              <View>
                <Text style={ui.body}>{t('useWallet')}</Text>
                <Text style={s.muted}>{t('walletBalanceN', { amount: fmtMoney2(user.walletBalance) })}</Text>
              </View>
              <Switch value={useWallet} onValueChange={setUseWallet} trackColor={{ true: C.accent }} />
            </View>
          ) : null}
        </View>

        <View style={[ui.card, { gap: S.s }]}>
          <Text style={s.label}>{t('promoCode')}</Text>
          <View style={{ flexDirection: 'row', gap: S.s }}>
            <TextInput value={promoInput} onChangeText={setPromoInput} autoCapitalize="characters" style={[ui.input, { flex: 1, minWidth: 0 }]} />
            <Button title={t('promoApply')} kind="outline" onPress={() => setPromo(promoInput.trim())} style={{ paddingHorizontal: S.l }} />
          </View>
          {cart.promo ? (
            <Text style={cart.promo.ok ? { color: C.accent } : ui.error}>
              {cart.promo.ok ? t('promoOk', { code: cart.promo.code }) : t('promoBad')}
            </Text>
          ) : null}
          <Text style={[s.label, { marginTop: S.s }]}>{t('note')}</Text>
          <TextInput value={note} onChangeText={setNote} multiline maxLength={500} style={[ui.input, { height: 80, paddingTop: S.m }]} />
        </View>

        <View style={[ui.card, { gap: S.s }]}>
          {cart.lines.map((l) => (
            <View key={l.key} style={s.row}>
              <Text style={[s.muted, { flex: 1 }]} numberOfLines={1}>
                {l.qty} × {l.name}
              </Text>
              <Text style={s.muted}>{fmtMoney(l.lineTotal)}</Text>
            </View>
          ))}
          <Row label={t('subTotal')} value={fmtMoney2(cart.subtotal)} />
          {cart.discount ? <Row label={t('discount')} value={`-${fmtMoney2(cart.discount)}`} /> : null}
          <Row label={t('deliveryFee')} value={cart.deliveryFee ? fmtMoney2(cart.deliveryFee) : t('free')} />
          {cart.tax ? <Row label={t('tax')} value={fmtMoney2(cart.tax)} /> : null}
          <Row label={t('total')} value={fmtMoney2(cart.total)} bold />
        </View>

        {err ? <Text style={ui.error}>{err}</Text> : null}
        <Button title={t('placeOrder')} onPress={place} busy={busy} disabled={blocked || !cart.lines.length || quote.loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={s.row}>
      <Text style={[s.muted, bold && s.bold]}>{label}</Text>
      <Text style={[s.muted, bold && s.bold]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  seg: { flexDirection: 'row', backgroundColor: C.card, borderRadius: R.m, padding: 4 },
  segItem: { flex: 1, height: 40, borderRadius: R.s, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: C.accent },
  segText: { fontSize: 15, fontWeight: '600', color: C.text },
  choice: { borderWidth: 1, borderColor: C.line, borderRadius: R.m, padding: S.m, gap: 2 },
  choiceOn: { borderColor: C.accent, borderWidth: 2 },
  choiceTitle: { fontSize: 15, fontWeight: '600', color: C.text },
  label: { fontSize: 14, fontWeight: '600', color: C.text },
  muted: { fontSize: 13, color: C.muted },
  bold: { fontSize: 16, color: C.text, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.s },
});
