import { router, useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, styles as ui } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Key } from '@/lib/dict';
import { useI18n } from '@/lib/i18n';
import { fmtMoney2 } from '@/lib/money';
import { C, R, S } from '@/lib/theme';
import type { Config, Lang, User } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const BLOCKER: Record<string, Key> = { orders: 'delOrders', returns: 'delReturns', store: 'delStore', admin: 'delAdmin' };

export default function AccountScreen() {
  const { t, lang, setLang } = useI18n();
  const { user, setUser, signOut, forget } = useAuth();
  const config = useApi<Config>('/config');
  // Unread counts for the menu (refreshed each time the tab is shown).
  const me = useApi<{ user: User; unread: { notifications: number; messages: number } }>(user ? '/me' : null);
  const { reload: reloadMe } = me;
  useFocusEffect(
    useCallback(() => {
      if (user) reloadMe();
    }, [user, reloadMe]),
  );
  const unread = me.data?.unread;
  const [busy, setBusy] = useState(false);

  const chooseLang = async (l: Lang) => {
    setLang(l);
    if (user) {
      const r = await api<{ user: User }>('/me', { method: 'PATCH', body: { lang: l } }).catch(() => null);
      if (r) setUser(r.user);
    }
  };

  const open = (url?: string) => url && WebBrowser.openBrowserAsync(url);

  const deleteAccount = () =>
    Alert.alert(t('deleteAccount'), t('delIntro'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delButton'),
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await api('/me', { method: 'DELETE', body: { confirm: 'DELETE' } });
            forget();
            Alert.alert(t('delDone'));
          } catch (e) {
            if (e instanceof ApiError && e.code === 'blocked') {
              Alert.alert(t('delBlocked'), e.reasons.map((r) => (BLOCKER[r] ? t(BLOCKER[r]) : r)).join('\n'));
            } else Alert.alert(t('errGeneric'));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: S.l, gap: S.l, paddingBottom: 60 }}>
        <Text style={ui.h1}>{t('account')}</Text>

        {user ? (
          <View style={[ui.card, { gap: S.xs }]}>
            <Text style={ui.h2}>{user.name || '—'}</Text>
            {user.phone ? <Text style={s.muted}>+{user.phone}</Text> : null}
            {user.email ? <Text style={s.muted}>{user.email}</Text> : null}
            <View style={s.stats}>
              <View style={s.stat}>
                <Text style={s.statValue}>{fmtMoney2(user.walletBalance)}</Text>
                <Text style={s.muted}>{t('wallet')}</Text>
              </View>
              <View style={s.stat}>
                <Text style={s.statValue}>{user.points}</Text>
                <Text style={s.muted}>{t('points')}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[ui.card, { gap: S.m }]}>
            <Text style={ui.body}>{t('signInWhy')}</Text>
            <Button title={t('signIn')} onPress={() => router.push('/login')} />
          </View>
        )}

        <View style={ui.card}>
          <Text style={[s.muted, { marginBottom: S.s }]}>{t('language')}</Text>
          <View style={s.langRow}>
            {(['so', 'en'] as const).map((l) => (
              <Pressable key={l} onPress={() => chooseLang(l)} style={[s.lang, lang === l && s.langOn]}>
                <Text style={[s.langText, lang === l && { color: '#fff' }]}>{l === 'so' ? 'Soomaali' : 'English'}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {user ? (
          <View style={[ui.card, { paddingVertical: S.xs }]}>
            <Item label={t('myOrders')} onPress={() => router.push('/orders')} />
            <Item label={t('wishlist')} onPress={() => router.push('/wishlist')} />
            <Item label={t('messages')} count={unread?.messages} onPress={() => router.push('/messages')} />
            <Item label={t('notifications')} count={unread?.notifications} onPress={() => router.push('/notifications')} />
            <Item label={t('udubWallet')} onPress={() => router.push('/wallet')} />
            <Item label={t('addresses')} onPress={() => router.push('/addresses')} last />
          </View>
        ) : null}

        <View style={[ui.card, { paddingVertical: S.xs }]}>
          <Item label={t('help')} onPress={() => open(config.data?.links.help)} />
          <Item label={t('privacy')} onPress={() => open(config.data?.links.privacy)} />
          <Item label={t('terms')} onPress={() => open(config.data?.links.terms)} last />
        </View>

        {user ? (
          <>
            <Button title={t('signOut')} kind="outline" onPress={signOut} />
            <Pressable onPress={deleteAccount} disabled={busy} style={{ alignSelf: 'center', padding: S.s }}>
              <Text style={{ color: C.red, fontSize: 14 }}>{t('deleteAccount')}</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Item({ label, onPress, last, count }: { label: string; onPress: () => void; last?: boolean; count?: number }) {
  return (
    <Pressable onPress={onPress} style={[s.item, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line }]}>
      <Text style={ui.body}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.s }}>
        {count ? (
          <View style={s.count}>
            <Text style={s.countText}>{count > 99 ? '99+' : count}</Text>
          </View>
        ) : null}
        <Text style={s.muted}>›</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  muted: { fontSize: 14, color: C.muted },
  stats: { flexDirection: 'row', gap: S.m, marginTop: S.m },
  stat: { flex: 1, backgroundColor: C.bg, borderRadius: R.m, padding: S.m },
  statValue: { fontSize: 18, fontWeight: '800', color: C.text },
  langRow: { flexDirection: 'row', gap: S.s },
  lang: { flex: 1, height: 44, borderRadius: R.m, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  langOn: { backgroundColor: C.accent, borderColor: C.accent },
  langText: { fontSize: 15, fontWeight: '600', color: C.text },
  count: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.lime,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: S.m },
});
