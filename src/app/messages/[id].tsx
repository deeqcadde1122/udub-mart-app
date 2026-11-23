import { Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignedIn } from '@/components/signed-in';
import { ErrorView, Loading, styles as ui } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { fmtDate } from '@/lib/dates';
import { useI18n } from '@/lib/i18n';
import { C, R, S } from '@/lib/theme';
import type { ChatMessage, Conversation } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function ConversationScreen() {
  return (
    <SignedIn>
      <ConversationView />
    </SignedIn>
  );
}

// A chat with a store (reply below; phone numbers are hidden by the website), or one message from Udub.
function ConversationView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();
  const insets = useSafeAreaInsets();
  const r = useApi<Conversation>(`/messages/${encodeURIComponent(id)}`);
  const [text, setText] = useState('');
  const [sent, setSent] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const list = useRef<FlatList<ChatMessage>>(null);

  if (r.error && !r.data) return <ErrorView error={r.error} onRetry={r.reload} />;
  if (!r.data) return <Loading />;
  const c = r.data;

  if (c.kind !== 'chat') {
    return (
      <ScrollView style={ui.screen} contentContainerStyle={{ padding: S.l, gap: S.s }}>
        <Stack.Screen options={{ title: t('fromUdub') }} />
        <Text style={ui.h2}>{c.title}</Text>
        <Text style={s.muted}>{fmtDate(c.at, lang, true)}</Text>
        <Text style={ui.body}>{c.body}</Text>
      </ScrollView>
    );
  }

  const messages = [...c.messages, ...sent.filter((m) => !c.messages.some((x) => x.id === m.id))];

  const send = async () => {
    if (!text.trim() || busy) return;
    setErr('');
    setBusy(true);
    try {
      const res = await api<{ message: ChatMessage }>(`/messages/${encodeURIComponent(id)}`, {
        method: 'POST',
        body: { body: text.trim() },
      });
      setSent((x) => [...x, res.message]);
      setText('');
      setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      setErr(e instanceof ApiError && e.status !== 0 ? e.message : t('errNetwork'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <Stack.Screen options={{ title: c.store.name }} />
      <FlatList
        ref={list}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: S.l, gap: S.s }}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={<Text style={[s.muted, { textAlign: 'center', marginBottom: S.s }]}>{t('chatSafety')}</Text>}
        ListEmptyComponent={<Text style={[s.muted, { textAlign: 'center' }]}>{t('chatEmpty')}</Text>}
        renderItem={({ item: m }) => (
          <View style={[s.bubble, m.mine ? s.mine : s.theirs]}>
            <Text style={{ color: m.mine ? '#fff' : C.text, fontSize: 15 }}>{m.body}</Text>
            <Text style={{ color: m.mine ? '#DDEEEE' : C.muted, fontSize: 11, marginTop: 2 }}>{fmtDate(m.at, lang, true)}</Text>
          </View>
        )}
      />
      {err ? <Text style={[ui.error, { paddingHorizontal: S.l }]}>{err}</Text> : null}
      <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, S.s) }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('chatPlaceholder')}
          placeholderTextColor={C.muted}
          multiline
          maxLength={1000}
          style={[ui.input, { flex: 1, height: undefined, minHeight: 44, maxHeight: 120, paddingTop: 12 }]}
        />
        <Pressable onPress={send} disabled={busy || !text.trim()} style={[s.send, (busy || !text.trim()) && { opacity: 0.5 }]}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{t('send')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  muted: { fontSize: 13, color: C.muted },
  bubble: { maxWidth: '80%', borderRadius: R.m, padding: S.m },
  mine: { alignSelf: 'flex-end', backgroundColor: C.accent },
  theirs: { alignSelf: 'flex-start', backgroundColor: C.card },
  bar: {
    flexDirection: 'row',
    gap: S.s,
    padding: S.s,
    paddingHorizontal: S.l,
    alignItems: 'flex-end',
    backgroundColor: C.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
  },
  send: {
    height: 44,
    paddingHorizontal: S.l,
    borderRadius: R.m,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
