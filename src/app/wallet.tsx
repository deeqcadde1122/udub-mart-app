import { FlatList, Share, StyleSheet, Text, View } from 'react-native';

import { SignedIn } from '@/components/signed-in';
import { Button, Empty, ErrorView, Loading, styles as ui } from '@/components/ui';
import { fmtDate } from '@/lib/dates';
import type { Key } from '@/lib/dict';
import { useI18n } from '@/lib/i18n';
import { fmtMoney2 } from '@/lib/money';
import { C, R, S } from '@/lib/theme';
import type { Wallet } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function WalletScreen() {
  return (
    <SignedIn>
      <WalletView />
    </SignedIn>
  );
}

// The Udub wallet (spend-only credit), points and the invite link (Refer & Earn).
function WalletView() {
  const { t, lang } = useI18n();
  const r = useApi<Wallet>('/wallet');
  if (r.error && !r.data) return <ErrorView error={r.error} onRetry={r.reload} />;
  if (!r.data) return <Loading />;
  const w = r.data;
  return (
    <FlatList
      style={ui.screen}
      data={w.entries}
      keyExtractor={(e) => e.id}
      contentContainerStyle={{ padding: S.l, gap: S.s }}
      ListHeaderComponent={
        <View style={{ gap: S.m, marginBottom: S.s }}>
          <View style={s.hero}>
            <Text style={{ color: '#DDEEEE' }}>{t('availableBalance')}</Text>
            <Text style={s.balance}>{fmtMoney2(w.balance)}</Text>
            <Text style={{ color: '#DDEEEE' }}>
              {t('points')}: {w.points}
            </Text>
          </View>
          <Text style={s.muted}>{t('walletSpendOnly')}</Text>
          {w.referral ? (
            <View style={[ui.card, { gap: S.s }]}>
              <Text style={ui.h2}>{t('inviteFriends')}</Text>
              <Text style={s.muted}>{t('yourInviteLink')}</Text>
              <Text selectable style={ui.body}>
                {w.referral.link}
              </Text>
              <Button title={t('share')} kind="outline" onPress={() => Share.share({ message: w.referral!.link })} />
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={<Empty title={t('walletActivityEmpty')} />}
      renderItem={({ item: e }) => (
        <View style={s.entry}>
          <View style={{ flex: 1 }}>
            <Text style={ui.body}>{t(`wk_${e.kind}` as Key)}</Text>
            <Text style={s.muted}>{fmtDate(e.at, lang)}</Text>
          </View>
          <Text style={[s.amount, { color: e.amount < 0 ? C.text : C.accent }]}>
            {e.amount > 0 ? '+' : ''}
            {fmtMoney2(e.amount)}
          </Text>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: C.deep, borderRadius: R.l, padding: S.xl, gap: S.xs },
  balance: { color: '#fff', fontSize: 34, fontWeight: '800' },
  muted: { fontSize: 13, color: C.muted },
  entry: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: R.m, padding: S.m },
  amount: { fontSize: 16, fontWeight: '700' },
});
