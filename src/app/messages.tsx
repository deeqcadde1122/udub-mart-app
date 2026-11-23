import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { SignedIn } from '@/components/signed-in';
import { Empty, ErrorView, Loading, styles as ui } from '@/components/ui';
import { fmtDate } from '@/lib/dates';
import { useI18n } from '@/lib/i18n';
import { C, R, S } from '@/lib/theme';
import type { InboxItem } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function MessagesScreen() {
  return (
    <SignedIn>
      <Inbox />
    </SignedIn>
  );
}

// Chats with stores and messages from Udub — the same inbox as the website's Messages.
function Inbox() {
  const { t, lang } = useI18n();
  const r = useApi<{ items: InboxItem[] }>('/messages');
  const { reload } = r;
  useFocusEffect(useCallback(() => reload(), [reload]));
  if (r.error && !r.data) return <ErrorView error={r.error} onRetry={r.reload} />;
  if (!r.data) return <Loading />;
  return (
    <FlatList
      style={ui.screen}
      data={r.data.items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: S.l, gap: S.s }}
      refreshControl={<RefreshControl refreshing={r.loading} onRefresh={r.reload} tintColor={C.accent} />}
      ListEmptyComponent={<Empty title={t('chatNone')} />}
      renderItem={({ item: m }) => (
        <Pressable onPress={() => router.push({ pathname: '/messages/[id]', params: { id: m.id } })} style={s.card}>
          {m.avatar ? (
            <Image source={m.avatar} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.udub]}>
              <Text style={s.udubText}>U</Text>
            </View>
          )}
          <View style={{ flex: 1, gap: 2 }}>
            <View style={s.row}>
              <Text style={[s.name, m.unread && { fontWeight: '800' }]} numberOfLines={1}>
                {m.name || t('fromUdub')}
              </Text>
              <Text style={s.muted}>{fmtDate(m.at, lang)}</Text>
            </View>
            <Text style={[s.muted, m.unread && { color: C.text }]} numberOfLines={2}>
              {m.preview}
            </Text>
          </View>
          {m.unread ? <View style={s.dot} /> : null}
        </Pressable>
      )}
    />
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.m, padding: S.m, flexDirection: 'row', gap: S.m, alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.line },
  udub: { backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  udubText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: S.s },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: C.text },
  muted: { fontSize: 13, color: C.muted },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.lime },
});
