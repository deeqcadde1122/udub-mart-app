import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Stars } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { fmtMoney } from '@/lib/money';
import { C, R, S } from '@/lib/theme';
import type { ProductCard as Card } from '@/lib/types';

export function ProductCard({ p, width }: { p: Card; width: number }) {
  const { t } = useI18n();
  const pct = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/p/[slug]', params: { slug: p.slug } })}
      style={StyleSheet.flatten([s.card, { width }])}>
      <View>
        <Image source={p.image ?? undefined} style={[s.img, { height: width }]} contentFit="cover" transition={150} />
        {pct > 0 ? (
          <View style={s.badge}>
            <Text style={s.badgeText}>-{pct}%</Text>
          </View>
        ) : null}
        {!p.inStock ? (
          <View style={s.soldOut}>
            <Text style={s.soldOutText}>{t('outOfStock')}</Text>
          </View>
        ) : null}
      </View>
      <View style={s.info}>
        <Text style={s.name} numberOfLines={2}>
          {p.name}
        </Text>
        <View style={s.priceRow}>
          <Text style={s.price}>{fmtMoney(p.price)}</Text>
          {p.oldPrice ? <Text style={s.old}>{fmtMoney(p.oldPrice)}</Text> : null}
        </View>
        <Stars rating={p.rating} count={p.ratingCount} />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.m, overflow: 'hidden' },
  img: { width: '100%', backgroundColor: C.line },
  info: { padding: S.s, gap: 2 },
  name: { fontSize: 13, color: C.text, minHeight: 34 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: S.xs },
  price: { fontSize: 15, fontWeight: '800', color: C.text },
  old: { fontSize: 12, color: C.muted, textDecorationLine: 'line-through' },
  badge: {
    position: 'absolute',
    top: S.s,
    left: S.s,
    backgroundColor: C.lime,
    borderRadius: R.s,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  soldOut: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 4 },
  soldOutText: { color: '#fff', fontSize: 12, textAlign: 'center', fontWeight: '600' },
});
