import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { errorKey } from '@/lib/links';
import { C, R, S } from '@/lib/theme';

export function Button({
  title,
  onPress,
  disabled,
  busy,
  kind = 'primary',
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  kind?: 'primary' | 'outline' | 'danger';
  style?: StyleProp<ViewStyle>;
}) {
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.btn,
        kind === 'primary' && { backgroundColor: C.accent },
        kind === 'outline' && { borderWidth: 1, borderColor: C.accent, backgroundColor: C.card },
        kind === 'danger' && { backgroundColor: C.red },
        (pressed || off) && { opacity: 0.6 },
        style,
      ]}>
      {busy ? (
        <ActivityIndicator color={kind === 'outline' ? C.accent : '#fff'} />
      ) : (
        <Text style={[styles.btnText, kind === 'outline' && { color: C.accent }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={C.accent} />
    </View>
  );
}

export function ErrorView({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  const { t } = useI18n();
  const msg = error.status === 404 ? t('notAvailable') : t(errorKey(error.code));
  return (
    <View style={styles.center}>
      <Text style={styles.muted}>{msg}</Text>
      {onRetry ? <Button title={t('retry')} kind="outline" onPress={onRetry} style={{ marginTop: S.l }} /> : null}
    </View>
  );
}

export function Empty({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <View style={styles.center}>
      <Text style={styles.h2}>{title}</Text>
      {text ? <Text style={[styles.muted, { marginTop: S.s }]}>{text}</Text> : null}
      {children}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.h2}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.link}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Stars({ rating, count }: { rating: number | null; count: number }) {
  if (!rating || !count) return null;
  return (
    <Text style={styles.stars}>
      ★ {rating.toFixed(1)} <Text style={styles.muted}>({count})</Text>
    </Text>
  );
}

export const styles = StyleSheet.create({
  btn: { height: 50, borderRadius: R.m, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.xl },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl, minHeight: 240 },
  h1: { fontSize: 24, fontWeight: '800', color: C.text },
  h2: { fontSize: 18, fontWeight: '700', color: C.text },
  body: { fontSize: 15, lineHeight: 22, color: C.text },
  muted: { fontSize: 14, color: C.muted, textAlign: 'center' },
  link: { fontSize: 14, fontWeight: '600', color: C.accent },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.l,
    marginTop: S.xl,
    marginBottom: S.m,
  },
  stars: { fontSize: 13, color: C.star, fontWeight: '600' },
  input: {
    height: 52,
    borderRadius: R.m,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
    paddingHorizontal: S.l,
    fontSize: 17,
    color: C.text,
  },
  error: { color: C.red, fontSize: 14, marginTop: S.s },
  screen: { flex: 1, backgroundColor: C.bg },
  card: { backgroundColor: C.card, borderRadius: R.l, padding: S.l },
});
