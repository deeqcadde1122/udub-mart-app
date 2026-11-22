import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Dimensions, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductRail } from '@/components/product-rail';
import { Button, ErrorView, Loading, Stars, styles as ui } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { addToCart } from '@/lib/cart';
import { useI18n } from '@/lib/i18n';
import { errorKey } from '@/lib/links';
import { fmtMoney } from '@/lib/money';
import { C, R, S } from '@/lib/theme';
import type { Product, ProductCard } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const W = Dimensions.get('window').width;
const isHex = (v: string) => /^#[0-9a-f]{3,8}$/i.test(v);

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const r = useApi<{ product: Product; similar: ProductCard[] }>(`/products/${encodeURIComponent(slug)}`);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(0);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);

  const p = r.data?.product;

  // Imported products list the size/colour pairs that can be ordered (and their own price).
  const variant = useMemo(() => {
    if (!p?.variants.length) return null;
    return (
      p.variants.find(
        (v) =>
          v.color === (p.colors.length > 1 ? color : (p.colors[0] ?? '')) && v.size === (p.sizes.length > 1 ? size : (p.sizes[0] ?? '')),
      ) ?? null
    );
  }, [p, color, size]);

  if (r.error && !p) return <ErrorView error={r.error} onRetry={r.reload} />;
  if (!p) return <Loading />;

  const needColor = p.colors.length > 1 && !color;
  const needSize = p.sizes.length > 1 && !size;
  const price = variant?.price ?? p.price;
  const inStock = p.variants.length ? (variant ? variant.inStock : p.inStock) : p.inStock;
  const colorOk = (c: string) =>
    !p.variants.length || p.variants.some((v) => v.color === c && v.inStock && (!size || p.sizes.length <= 1 || v.size === size));
  const sizeOk = (z: string) =>
    !p.variants.length || p.variants.some((v) => v.size === z && v.inStock && (!color || p.colors.length <= 1 || v.color === color));

  const add = async () => {
    if (!user) return router.push('/login');
    if (needColor) return Alert.alert(t('pickColour'));
    if (needSize) return Alert.alert(t('pickSize'));
    setBusy(true);
    try {
      await addToCart({
        productId: p.id,
        qty,
        color: p.colors.length > 1 ? color : (p.colors[0] ?? ''),
        size: p.sizes.length > 1 ? size : (p.sizes[0] ?? ''),
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      Alert.alert(t(errorKey(e instanceof ApiError ? e.code : 'unknown')));
    } finally {
      setBusy(false);
    }
  };

  const images = p.images.filter((x): x is string => !!x);

  return (
    <View style={ui.screen}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <FlatList
          horizontal
          pagingEnabled
          data={images.length ? images : ['']}
          keyExtractor={(x, i) => `${i}`}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setPhoto(Math.round(e.nativeEvent.contentOffset.x / W))}
          renderItem={({ item }) => (
            <Image source={item || undefined} style={{ width: W, height: W, backgroundColor: C.line }} contentFit="cover" />
          )}
        />
        {images.length > 1 ? (
          <View style={s.dots}>
            {images.map((_, i) => (
              <View key={i} style={[s.dot, i === photo && { backgroundColor: C.accent }]} />
            ))}
          </View>
        ) : null}

        <View style={{ padding: S.l, gap: S.s }}>
          {p.brand ? <Text style={s.brand}>{p.brand}</Text> : null}
          <Text style={ui.h1}>{p.name}</Text>
          {p.short ? <Text style={s.muted}>{p.short}</Text> : null}
          <View style={s.priceRow}>
            <Text style={s.price}>{fmtMoney(price)}</Text>
            {p.oldPrice && p.oldPrice > price ? <Text style={s.old}>{fmtMoney(p.oldPrice)}</Text> : null}
          </View>
          <Stars rating={p.rating} count={p.ratingCount} />
          {!inStock ? <Text style={{ color: C.red, fontWeight: '600' }}>{t('outOfStock')}</Text> : null}

          {p.colors.length > 1 ? (
            <Options
              label={p.optionName && !p.sizes.length ? p.optionName : t('colour')}
              values={p.colors}
              value={color}
              onChange={setColor}
              ok={colorOk}
              swatch
            />
          ) : null}
          {p.sizes.length > 1 ? <Options label={t('size')} values={p.sizes} value={size} onChange={setSize} ok={sizeOk} /> : null}

          <View style={s.qtyRow}>
            <Text style={s.label}>{t('quantity')}</Text>
            <View style={s.qty}>
              <Pressable onPress={() => setQty(Math.max(1, qty - 1))} style={s.qtyBtn}>
                <Text style={s.qtyBtnText}>−</Text>
              </Pressable>
              <Text style={s.qtyText}>{qty}</Text>
              <Pressable onPress={() => setQty(Math.min(20, qty + 1))} style={s.qtyBtn}>
                <Text style={s.qtyBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => router.push({ pathname: '/products', params: { store: p.store.slug, title: p.store.name } })}
            style={s.store}>
            <Image source={p.store.logo ?? undefined} style={s.storeLogo} />
            <Text style={{ flex: 1, color: C.text }}>{t('soldBy', { store: p.store.name })}</Text>
            <Text style={s.muted}>›</Text>
          </Pressable>

          <Block title={t('description')} text={p.description} />
          <Block title={t('howToUse')} text={p.howToUse} />
          <Block title={t('keyIngredients')} text={p.keyIngredients} />
          <Block title={t('ingredients')} text={p.ingredients} />

          <Text style={[ui.h2, { marginTop: S.l }]}>
            {t('reviews')} {p.ratingCount ? `(${p.ratingCount})` : ''}
          </Text>
          {p.reviews.length ? (
            p.reviews.map((rv) => (
              <View key={rv.id} style={s.review}>
                <Text style={ui.stars}>
                  {'★'.repeat(rv.rating)}
                  {'☆'.repeat(5 - rv.rating)}
                </Text>
                <Text style={{ fontWeight: '600', color: C.text }}>{rv.name ?? t('deletedAccount')}</Text>
                {rv.text ? <Text style={ui.body}>{rv.text}</Text> : null}
              </View>
            ))
          ) : (
            <Text style={s.muted}>{t('noReviews')}</Text>
          )}

          {p.questions.length ? (
            <>
              <Text style={[ui.h2, { marginTop: S.l }]}>{t('questions')}</Text>
              {p.questions.map((qa) => (
                <View key={qa.id} style={s.review}>
                  <Text style={{ fontWeight: '600', color: C.text }}>{qa.question}</Text>
                  <Text style={ui.body}>{qa.answer}</Text>
                </View>
              ))}
            </>
          ) : null}
        </View>

        <ProductRail title={t('similar')} items={r.data?.similar ?? []} />
      </ScrollView>

      <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, S.m) }]}>
        <Button
          title={added ? t('added') : inStock ? t('addToCart') : t('outOfStock')}
          onPress={add}
          busy={busy}
          disabled={!inStock}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function Options({
  label,
  values,
  value,
  onChange,
  ok,
  swatch,
}: {
  label: string;
  values: string[];
  value: string;
  onChange: (v: string) => void;
  ok: (v: string) => boolean;
  swatch?: boolean;
}) {
  return (
    <View style={{ gap: S.s, marginTop: S.s }}>
      <Text style={s.label}>
        {label}
        {value && !isHex(value) ? `: ${value}` : ''}
      </Text>
      <View style={s.opts}>
        {values.map((v) => {
          const on = v === value;
          const can = ok(v);
          return swatch && isHex(v) ? (
            <Pressable
              key={v}
              onPress={() => onChange(v)}
              disabled={!can}
              style={[s.swatchRing, on && { borderColor: C.accent }, !can && { opacity: 0.3 }]}>
              <View style={[s.swatch, { backgroundColor: v }]} />
            </Pressable>
          ) : (
            <Pressable key={v} onPress={() => onChange(v)} disabled={!can} style={[s.opt, on && s.optOn, !can && { opacity: 0.35 }]}>
              <Text style={[s.optText, on && { color: '#fff' }]}>{v}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  if (!text?.trim()) return null;
  return (
    <View style={{ marginTop: S.l, gap: S.xs }}>
      <Text style={ui.h2}>{title}</Text>
      <Text style={ui.body}>{text.trim()}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: S.s },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.line },
  brand: { fontSize: 13, color: C.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  muted: { fontSize: 14, color: C.muted },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: S.s },
  price: { fontSize: 24, fontWeight: '800', color: C.text },
  old: { fontSize: 16, color: C.muted, textDecorationLine: 'line-through' },
  label: { fontSize: 15, fontWeight: '600', color: C.text },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: S.s },
  opt: { borderWidth: 1, borderColor: C.line, backgroundColor: C.card, borderRadius: R.s, paddingHorizontal: S.m, paddingVertical: S.s },
  optOn: { backgroundColor: C.accent, borderColor: C.accent },
  optText: { fontSize: 14, color: C.text },
  swatchRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: S.m },
  qty: { flexDirection: 'row', alignItems: 'center', gap: S.m },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
  qtyBtnText: { fontSize: 20, color: C.text },
  qtyText: { minWidth: 22, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  store: { flexDirection: 'row', alignItems: 'center', gap: S.m, backgroundColor: C.card, borderRadius: R.m, padding: S.m, marginTop: S.m },
  storeLogo: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.line },
  review: { backgroundColor: C.card, borderRadius: R.m, padding: S.m, gap: 4 },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingHorizontal: S.l,
    paddingTop: S.m,
    backgroundColor: C.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
  },
});
