import { FlatList, View } from 'react-native';

import { ProductCard } from '@/components/product-card';
import { SectionTitle } from '@/components/ui';
import { S } from '@/lib/theme';
import type { ProductCard as Card } from '@/lib/types';

/** A titled, sideways-scrolling row of product cards (home, similar products). */
export function ProductRail({ title, items, action, onAction }: { title: string; items: Card[]; action?: string; onAction?: () => void }) {
  if (!items.length) return null;
  return (
    <View>
      <SectionTitle title={title} action={action} onAction={onAction} />
      <FlatList
        horizontal
        data={items}
        keyExtractor={(p) => p.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: S.l, gap: S.m }}
        renderItem={({ item }) => <ProductCard p={item} width={150} />}
      />
    </View>
  );
}
