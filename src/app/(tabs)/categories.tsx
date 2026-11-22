import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Dimensions, FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Empty, ErrorView, Loading, styles as ui } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { C, R, S } from '@/lib/theme';
import type { Category } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const TILE = (Dimensions.get('window').width - S.l * 2 - S.m) / 2;

export default function CategoriesScreen() {
  const { t } = useI18n();
  const r = useApi<{ categories: Category[] }>('/categories');
  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <Text style={[ui.h1, { paddingHorizontal: S.l, paddingVertical: S.m }]}>{t('categories')}</Text>
      {r.error && !r.data ? (
        <ErrorView error={r.error} onRetry={r.reload} />
      ) : !r.data ? (
        <Loading />
      ) : (
        <FlatList
          data={r.data.categories}
          numColumns={2}
          keyExtractor={(c) => c.id}
          contentInsetAdjustmentBehavior="automatic"
          columnWrapperStyle={{ gap: S.m }}
          contentContainerStyle={{ paddingHorizontal: S.l, gap: S.m, paddingBottom: 40 }}
          ListEmptyComponent={<Empty title={t('noProducts')} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/products', params: { category: item.slug, title: item.name } })}
              style={s.tile}>
              <Image source={item.image ?? undefined} style={s.img} contentFit="cover" />
              <Text style={s.name} numberOfLines={2}>
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tile: { width: TILE, backgroundColor: C.card, borderRadius: R.m, overflow: 'hidden' },
  img: { width: '100%', height: TILE * 0.75, backgroundColor: C.line },
  name: { padding: S.m, fontSize: 15, fontWeight: '600', color: C.text },
});
