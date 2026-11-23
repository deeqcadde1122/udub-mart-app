import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ItemActions } from '@/components/item-actions';
import { SignedIn } from '@/components/signed-in';
import { Button, ErrorView, Loading, styles as ui } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { fmtDate } from '@/lib/dates';
import type { Key } from '@/lib/dict';
import { useI18n } from '@/lib/i18n';
import { fmtMoney, fmtMoney2 } from '@/lib/money';
import { C, R, S } from '@/lib/theme';
import type { OrderDetail } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function OrderScreen() {
  return (
    <SignedIn>
      <Order />
    </SignedIn>
  );
}

type PayResult = 'paid' | 'declined' | 'waiting' | 'busy' | 'notAllowed';
const PAY_MSG: Record<PayResult, Key> = {
  paid: 'payDone',
  declined: 'payDeclined',
  waiting: 'payWaiting',
  busy: 'payFailed',
  notAllowed: 'payFailed',
};

// One of my orders (GET /orders/<id>): what's owed and how to pay it, the delivery code while a
// shipment is on its way, items, money and the timeline.
function Order() {
  const { trackingId, placed } = useLocalSearchParams<{ trackingId: string; placed?: string }>();
  const { t, lang } = useI18n();
  const r = useApi<{ order: OrderDetail }>(`/orders/${encodeURIComponent(trackingId)}`);
  const [payer, setPayer] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const o = r.data?.order;
  if (r.error && !o) return <ErrorView error={r.error} onRetry={r.reload} />;
  if (!o) return <Loading />;

  const pay = async () => {
    setPaying(true);
    setPayMsg(null);
    try {
      const res = await api<{ result: PayResult }>(`/orders/${encodeURIComponent(o.trackingId)}/pay`, {
        method: 'POST',
        body: { payer: payer ?? o.payment.payer ?? '' },
      });
      setPayMsg({ text: t(PAY_MSG[res.result] ?? 'payFailed'), ok: res.result === 'paid' });
      r.reload();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      setPayMsg({
        text: code === 'limit' ? t('payTooMany') : e instanceof ApiError && e.status === 400 ? e.message : t('payFailed'),
        ok: false,
      });
    } finally {
      setPaying(false);
    }
  };

  const code = o.shipments.find((sh) => sh.deliveryCode);

  return (
    <ScrollView
      style={ui.screen}
      contentContainerStyle={{ padding: S.l, gap: S.l, paddingBottom: 60 }}
      refreshControl={<RefreshControl refreshing={r.loading} onRefresh={r.reload} tintColor={C.accent} />}
      keyboardShouldPersistTaps="handled">
      {placed ? <Text style={[ui.h2, { textAlign: 'center' }]}>{t('orderPlaced')}</Text> : null}

      <View style={[ui.card, { gap: S.xs }]}>
        <Text style={s.muted}>
          {t('orderNumber')} · {o.number}
        </Text>
        <Text style={ui.h2}>{t(`st_${o.status}` as Key)}</Text>
        <Text style={s.muted}>
          {t('orderDate')}: {fmtDate(o.date, lang, true)}
        </Text>
      </View>

      {o.payment.payNow ? (
        <View style={[ui.card, { gap: S.s }]}>
          <Text style={ui.h2}>{t('payWith', { amount: fmtMoney2(o.toPay), method: o.payMethod.label })}</Text>
          <Text style={s.label}>{t('payPhone')}</Text>
          <TextInput value={payer ?? o.payment.payer ?? ''} onChangeText={setPayer} keyboardType="phone-pad" style={ui.input} />
          <Button title={t('payButton')} onPress={pay} busy={paying} />
          {paying ? <Text style={s.muted}>{t('payCheckPhone', { method: o.payMethod.label })}</Text> : null}
        </View>
      ) : null}
      {payMsg ? <Text style={payMsg.ok ? s.ok : ui.error}>{payMsg.text}</Text> : null}
      {o.payment.sendTo ? (
        <View style={[ui.card, { gap: S.xs }]}>
          <Text style={ui.body}>{t('sendTo', { amount: fmtMoney2(o.toPay) })}</Text>
          <Text selectable style={s.big}>
            {o.payment.sendTo}
          </Text>
          <Text style={s.muted}>
            {o.payMethod.label} · {t('manualConfirm')}
          </Text>
        </View>
      ) : null}
      {o.payment.cardLink ? (
        <Button title={`${t('payByCard')} · ${fmtMoney2(o.toPay)}`} onPress={() => WebBrowser.openBrowserAsync(o.payment.cardLink!)} />
      ) : null}

      {code ? (
        <View style={[ui.card, s.codeCard]}>
          <Text style={[s.label, { color: '#fff' }]}>{t('yourDeliveryCode')}</Text>
          <Text selectable style={s.code}>
            {code.deliveryCode}
          </Text>
          <Text style={{ color: '#fff', fontSize: 13, textAlign: 'center' }}>{t('deliveryCodeNote')}</Text>
        </View>
      ) : null}

      {o.shipments.map((sh) => (
        <View key={sh.id} style={[ui.card, { gap: S.s }]}>
          <View style={s.row}>
            <Text style={s.label}>{sh.storeName}</Text>
            <Text style={s.badge}>{t(`sh_${sh.status}` as Key)}</Text>
          </View>
          {sh.deliveryTime ? (
            <Text style={s.muted}>
              {t('estDelivery')}: {sh.deliveryTime}
            </Text>
          ) : null}
          {o.items
            .filter((i) => i.shipmentId === sh.id || (!i.shipmentId && o.shipments.length === 1))
            .map((i) => (
              <View key={i.id} style={{ gap: S.xs }}>
                <View style={s.item}>
                  <Image source={i.image ?? undefined} style={s.img} />
                  <View style={{ flex: 1 }}>
                    <Text style={ui.body} numberOfLines={2}>
                      {i.name}
                    </Text>
                    {i.size || i.color ? <Text style={s.muted}>{[i.color, i.size].filter(Boolean).join(' · ')}</Text> : null}
                    <Text style={s.muted}>
                      {i.qty} × {fmtMoney(i.unitPrice)}
                    </Text>
                  </View>
                </View>
                <ItemActions item={i} replacementEnabled={o.replacementEnabled} onChanged={r.reload} />
              </View>
            ))}
        </View>
      ))}

      <View style={[ui.card, { gap: S.s }]}>
        <Text style={ui.h2}>{t('deliveryDetails')}</Text>
        {o.fulfilment === 'PICKUP' ? (
          <Text style={ui.body}>{t('pickup')}</Text>
        ) : (
          <>
            <Text style={ui.body}>{o.shipTo.name}</Text>
            <Text style={s.muted}>{[o.shipTo.details, o.shipTo.district, o.shipTo.city].filter(Boolean).join(', ')}</Text>
          </>
        )}
        <Row label={t('paymentMethod')} value={o.payMethod.label} />
        <Row label={t('paymentStatus')} value={o.paid ? t('paid') : t('unpaid')} />
        <Row label={t('subTotal')} value={fmtMoney2(o.subtotal)} />
        {o.discount ? <Row label={t('discount')} value={`-${fmtMoney2(o.discount)}`} /> : null}
        <Row label={t('deliveryFee')} value={o.deliveryFee ? fmtMoney2(o.deliveryFee) : t('free')} />
        {o.tax ? <Row label={t('tax')} value={fmtMoney2(o.tax)} /> : null}
        {o.walletPaid ? <Row label={t('paidFromWallet')} value={`-${fmtMoney2(o.walletPaid)}`} /> : null}
        <Row label={t('total')} value={fmtMoney2(o.total)} bold />
      </View>

      {o.history.length ? (
        <View style={[ui.card, { gap: S.s }]}>
          <Text style={ui.h2}>{t('timeline')}</Text>
          {o.history.map((h, i) => (
            <Row key={i} label={t(`st_${h.status}` as Key)} value={fmtDate(h.at, lang, true)} />
          ))}
        </View>
      ) : null}
    </ScrollView>
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
  muted: { fontSize: 13, color: C.muted },
  label: { fontSize: 15, fontWeight: '700', color: C.text },
  bold: { fontSize: 16, color: C.text, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.s },
  big: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: 1 },
  ok: { color: C.accent, fontSize: 15, fontWeight: '600' },
  codeCard: { backgroundColor: C.deep, alignItems: 'center', gap: S.s },
  code: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: 8 },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: C.accent,
    backgroundColor: C.bg,
    borderRadius: R.s,
    paddingHorizontal: S.s,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  item: { flexDirection: 'row', gap: S.m, alignItems: 'center' },
  img: { width: 56, height: 56, borderRadius: R.s, backgroundColor: C.line },
});
