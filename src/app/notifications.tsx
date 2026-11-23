import { router } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { SignedIn } from '@/components/signed-in';
import { Empty, ErrorView, Loading, styles as ui } from '@/components/ui';
import { api } from '@/lib/api';
import { fmtDate } from '@/lib/dates';
import { useI18n } from '@/lib/i18n';
import { appHref } from '@/lib/links';
import { C, R, S } from '@/lib/theme';
import type { Notification } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function NotificationsScreen() {
  return (
    <SignedIn>
      <Notifications />
    </SignedIn>
  );
}

// The bell (GET /notifications). Opening the list marks everything read, like the website.
function Notifications() {
  const { t, lang } = useI18n();
  const r = useApi<{ notifications: Notification[] }>('/notifications');
  const hasUnread = !!r.data?.notifications.some((n) => !n.read);
  useEffect(() => {
    if (hasUnread) api('/notifications', { method: 'POST' }).catch(() => {});
  }, [hasUnread]);

  if (r.error && !r.data) return <ErrorView error={r.error} onRetry={r.reload} />;
  if (!r.data) return <Loading />;
  return (
    <FlatList
      style={ui.screen}
      data={r.data.notifications}
      keyExtractor={(n) => n.id}
      contentContainerStyle={{ padding: S.l, gap: S.s }}
      refreshControl={<RefreshControl refreshing={r.loading} onRefresh={r.reload} tintColor={C.accent} />}
      ListEmptyComponent={<Empty title={t('noNotifications')} />}
      renderItem={({ item: n }) => (
        <Pressable onPress={() => n.link && router.push(appHref(n.link))} style={[s.card, !n.read && s.unread]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.title}>{n.title}</Text>
            {n.body ? <Text style={s.body}>{n.body}</Text> : null}
            <Text style={s.muted}>{fmtDate(n.at, lang, true)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.m, padding: S.m, flexDirection: 'row' },
  unread: { borderLeftWidth: 4, borderLeftColor: C.lime },
  title: { fontSize: 15, fontWeight: '700', color: C.text },
  body: { fontSize: 14, color: C.text },
  muted: { fontSize: 12, color: C.muted },
});
