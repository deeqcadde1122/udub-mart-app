import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { ProductCard } from '@/components/product-card';
import { Button, Empty, ErrorView, Loading, styles as ui } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C, S } from '@/lib/theme';
import type { ProductCard as Card, ProductList } from '@/lib/types';

const CARD = (Dimensions.get('window').width - S.l * 2 - S.m) / 2;

type Params = { q?: string; category?: string; store?: string; deals?: string; sort?: string; title?: string };

// The product list: search results, a category, a store, deals or new arrivals (GET /products).
export default function ProductsScreen() {
  const p = useLocalSearchParams<Params>();
  const { t, lang } = useI18n();
  const { token } = useAuth();
  const [q, setQ] = useState(p.q ?? '');
  const [items, setItems] = useState<Card[]>([]);
  const [info, setInfo] = useState<Omit<ProductList, 'products'> | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [n, setN] = useState(0);

  const query = (page: number) => {
    const sp = new URLSearchParams();
    if (p.q) sp.set('q', p.q);
    if (p.category) sp.set('category', p.category);
    if (p.store) sp.set('store', p.store);
    if (p.deals) sp.set('deals', '1');
    if (p.sort) sp.set('sort', p.sort);
    sp.set('page', String(page));
    return `/products?${sp}`;
  };

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    api<ProductList>(query(1), { signal: ac.signal })
      .then(({ products, ...rest }) => {
        setItems(products);
        setInfo(rest);
        setLoading(false);
      })
      .catch((e) => {
        if (e?.name === 'AbortError') return;
        setError(e instanceof ApiError ? e : new ApiError(0, 'unknown', String(e)));
        setLoading(false);
      });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.q, p.category, p.store, p.deals, p.sort, lang, token, n]);

  const more = async () => {
    if (!info?.hasMore || loading) return;
    setLoading(true);
    try {
      const { products, ...rest } = await api<ProductList>(query(info.page + 1));
      const known = new Set(items.map((x) => x.id));
      setItems([...items, ...products.filter((x) => !known.has(x.id))]);
      setInfo(rest);
    } catch {
      // keep what's shown; the next scroll tries again
    } finally {
      setLoading(false);
    }
  };

  const search = (text = q) => router.setParams({ q: text.trim() });
  const title = p.title || (p.q ? t('search') : '');

  return (
    <View style={ui.screen}>
      <Stack.Screen options={{ title }} />
      <View style={{ paddingHorizontal: S.l, paddingBottom: S.s }}>
        <TextInput
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => search()}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={C.muted}
          returnKeyType="search"
          style={ui.input}
        />
      </View>
      {error && !items.length ? (
        <ErrorView error={error} onRetry={() => setN((x) => x + 1)} />
      ) : loading && !items.length ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(x) => x.id}
          columnWrapperStyle={{ gap: S.m }}
          contentContainerStyle={{ paddingHorizontal: S.l, gap: S.m, paddingBottom: 40 }}
          onEndReached={more}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            info ? (
              <View style={{ gap: S.xs }}>
                {info.similarOnly && p.q ? <Text style={[ui.muted, { textAlign: 'left' }]}>{t('similarResults', { q: p.q })}</Text> : null}
                {info.didYouMean ? (
                  <Pressable
                    onPress={() => {
                      setQ(info.didYouMean!);
                      search(info.didYouMean!);
                    }}>
                    <Text style={ui.link}>{t('didYouMean', { q: info.didYouMean })}</Text>
                  </Pressable>
                ) : null}
                {items.length ? <Text style={[ui.muted, { textAlign: 'left' }]}>{t('results', { n: info.total })}</Text> : null}
              </View>
            ) : undefined
          }
          ListEmptyComponent={<Empty title={t('notFound')} text={t('notFoundText')} />}
          ListFooterComponent={
            info?.hasMore ? (
              <Button title={t('loadMore')} kind="outline" onPress={more} busy={loading} style={{ marginTop: S.s }} />
            ) : undefined
          }
          renderItem={({ item }) => <ProductCard p={item} width={CARD} />}
        />
      )}
    </View>
  );
}
