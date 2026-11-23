import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, styles as ui } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { fmtDate } from '@/lib/dates';
import { useI18n } from '@/lib/i18n';
import { C, S } from '@/lib/theme';
import type { OrderDetail } from '@/lib/types';

type Item = OrderDetail['items'][number];

/** Under a delivered order line: rate it (POST /reviews) and ask to return or replace it inside
 *  the return window (POST /returns). The website decides who may do what; this only shows it. */
export function ItemActions({ item, replacementEnabled, onChanged }: { item: Item; replacementEnabled: boolean; onChanged: () => void }) {
  const { t, lang } = useI18n();
  const [rating, setRating] = useState(item.myRating ?? 0);
  const [text, setText] = useState('');
  const [writing, setWriting] = useState(false);
  const [ret, setRet] = useState<'RETURN' | 'REPLACE' | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const r = item.return;
  if (!item.canReview && r.state !== 'requested') return null;

  const sendReview = async (stars: number, body = text) => {
    setBusy(true);
    setMsg(null);
    try {
      await api('/reviews', { method: 'POST', body: { productId: item.productId, rating: stars, text: body.trim() } });
      setWriting(false);
      setMsg({ text: t('reviewSaved'), ok: true });
    } catch (e) {
      setMsg({ text: e instanceof ApiError && e.status !== 0 ? e.message : t('errNetwork'), ok: false });
    } finally {
      setBusy(false);
    }
  };

  const sendReturn = async () => {
    if (!ret) return;
    setBusy(true);
    setMsg(null);
    try {
      await api('/returns', { method: 'POST', body: { orderItemId: item.id, reason: reason.trim(), kind: ret } });
      setRet(null);
      setMsg({ text: t('returnSent'), ok: true });
      onChanged();
    } catch (e) {
      setMsg({ text: e instanceof ApiError && e.code === 'closed' ? t('returnClosedErr') : t('errGeneric'), ok: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.box}>
      {item.canReview ? (
        <View style={{ gap: S.s }}>
          <View style={s.row}>
            <Text style={s.label}>{t('yourRating')}</Text>
            <View style={s.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  hitSlop={6}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={`${n}/5`}
                  onPress={() => {
                    setRating(n);
                    // A tap on the stars saves straight away (like the order page on the website).
                    sendReview(n);
                  }}>
                  <Text style={[s.star, { color: n <= rating ? C.star : C.line }]}>★</Text>
                </Pressable>
              ))}
            </View>
          </View>
          {rating > 0 && !writing ? (
            <Pressable onPress={() => setWriting(true)} hitSlop={6}>
              <Text style={ui.link}>{t('writeReview')}</Text>
            </Pressable>
          ) : null}
          {writing ? (
            <>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={t('yourReview')}
                placeholderTextColor={C.muted}
                multiline
                maxLength={1000}
                style={[ui.input, { height: 90, paddingTop: S.m }]}
              />
              <Button title={t('submit')} onPress={() => sendReview(rating)} busy={busy} />
            </>
          ) : null}
        </View>
      ) : null}

      {r.state === 'requested' ? (
        <Text style={[s.small, { color: r.status === 'REJECTED' ? C.red : C.accent }]}>
          {t(`ret_${r.status}`)}
          {r.note ? ` — ${r.note}` : ''}
        </Text>
      ) : r.state === 'open' ? (
        <View style={{ gap: S.s }}>
          <Text style={s.small}>{t('returnUntil', { date: fmtDate(r.until, lang) })}</Text>
          {ret ? (
            <>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder={ret === 'REPLACE' ? t('replaceReason') : t('returnReason')}
                placeholderTextColor={C.muted}
                multiline
                maxLength={500}
                style={[ui.input, { height: 90, paddingTop: S.m }]}
              />
              <Button title={t('sendReturn')} onPress={sendReturn} busy={busy} disabled={reason.trim().length < 3} />
              <Pressable onPress={() => setRet(null)} hitSlop={6} style={{ alignSelf: 'center' }}>
                <Text style={s.small}>{t('cancel')}</Text>
              </Pressable>
            </>
          ) : (
            <View style={s.row}>
              <Button title={t('returnItem')} kind="outline" onPress={() => setRet('RETURN')} style={{ flex: 1 }} />
              {replacementEnabled ? (
                <Button title={t('replaceItem')} kind="outline" onPress={() => setRet('REPLACE')} style={{ flex: 1 }} />
              ) : null}
            </View>
          )}
        </View>
      ) : null}

      {msg ? <Text style={[s.small, { color: msg.ok ? C.accent : C.red }]}>{msg.text}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  box: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line, paddingTop: S.s, marginTop: S.xs, gap: S.m },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.s },
  label: { fontSize: 14, fontWeight: '600', color: C.text },
  stars: { flexDirection: 'row', gap: 2 },
  star: { fontSize: 26 },
  small: { fontSize: 13, color: C.muted },
});
