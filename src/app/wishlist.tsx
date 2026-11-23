import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Dimensions, FlatList } from 'react-native';

import { ProductCard } from '@/components/product-card';
import { SignedIn } from '@/components/signed-in';
import { Empty, ErrorView, Loading, styles as ui } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { S } from '@/lib/theme';
import type { ProductCard as Card } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const CARD = (Dimensions.get('window').width - S.l * 2 - S.m) / 2;

export default function WishlistScreen() {
  return (
    <SignedIn>
      <Wishlist />
    </SignedIn>
  );
}

function Wishlist() {
  const { t } = useI18n();
  const r = useApi<{ products: Card[] }>('/wishlist');
  const { reload } = r;
  useFocusEffect(useCallback(() => reload(), [reload]));
  if (r.error && !r.data) return <ErrorView error={r.error} onRetry={r.reload} />;
  if (!r.data) return <Loading />;
  return (
    <FlatList
      style={ui.screen}
      data={r.data.products}
      numColumns={2}
      keyExtractor={(p) => p.id}
      columnWrapperStyle={{ gap: S.m }}
      contentContainerStyle={{ padding: S.l, gap: S.m }}
      ListEmptyComponent={<Empty title={t('wishlistEmpty')} />}
      renderItem={({ item }) => <ProductCard p={item} width={CARD} />}
    />
  );
}
