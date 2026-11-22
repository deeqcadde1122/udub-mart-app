import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Dimensions, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductRail } from '@/components/product-rail';
import { ErrorView, Loading, SectionTitle, styles as ui } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { appHref } from '@/lib/links';
import { C, R, S } from '@/lib/theme';
import type { Home } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const W = Dimensions.get('window').width;

export default function HomeScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const home = useApi<Home>('/home');
  const [q, setQ] = useState('');

  const search = () => {
    if (q.trim()) router.push({ pathname: '/products', params: { q: q.trim() } });
  };

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={home.loading && !!home.data} onRefresh={home.reload} tintColor={C.accent} />}
        contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.header}>
          <Image source={require('@/assets/images/wordmark.png')} style={s.wordmark} contentFit="contain" />
          <Text style={s.hello}>{user?.name ? t('hello', { name: user.name.split(' ')[0] }) : t('helloAnon')}</Text>
          <TextInput
            value={q}
            onChangeText={setQ}
            onSubmitEditing={search}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={C.muted}
            returnKeyType="search"
            style={[ui.input, s.search]}
          />
        </View>

        {home.error && !home.data ? (
          <ErrorView error={home.error} onRetry={home.reload} />
        ) : !home.data ? (
          <Loading />
        ) : (
          <>
            {home.data.showcase.length ? (
              <FlatList
                horizontal
                pagingEnabled
                data={home.data.showcase}
                keyExtractor={(x) => x.id}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable onPress={() => router.push(appHref(item.link))} style={s.slideWrap}>
                    <View style={s.slide}>
                      <Image
                        source={item.image ?? undefined}
                        style={StyleSheet.absoluteFill}
                        contentFit={item.cutout ? 'contain' : 'cover'}
                      />
                      <View style={s.slideShade} />
                      <View style={s.slideText}>
                        {item.title ? <Text style={s.slideTitle}>{item.title}</Text> : null}
                        {item.subtitle ? <Text style={s.slideSub}>{item.subtitle}</Text> : null}
                        <Text style={s.slideLink}>{t('shopNow')} →</Text>
                      </View>
                    </View>
                  </Pressable>
                )}
              />
            ) : null}

            {home.data.categories.length ? (
              <>
                <SectionTitle title={t('categories')} action={t('seeAll')} onAction={() => router.navigate('/categories')} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: S.l, gap: S.s }}>
                  {home.data.categories.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => router.push({ pathname: '/products', params: { category: c.slug, title: c.name } })}
                      style={s.chip}>
                      <Text style={s.chipText}>{c.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : null}

            <ProductRail
              title={t('bestDeals')}
              items={home.data.deals}
              action={t('seeAll')}
              onAction={() => router.push({ pathname: '/products', params: { deals: '1', title: t('bestDeals') } })}
            />
            <ProductRail title={t('recommended')} items={home.data.recommended} />
            <ProductRail
              title={t('newArrivals')}
              items={home.data.newArrivals}
              action={t('seeAll')}
              onAction={() => router.push({ pathname: '/products', params: { sort: 'new', title: t('newArrivals') } })}
            />

            {home.data.stores.length ? (
              <>
                <SectionTitle title={t('stores')} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: S.l, gap: S.m }}>
                  {home.data.stores.map((st) => (
                    <Pressable
                      key={st.id}
                      onPress={() => router.push({ pathname: '/products', params: { store: st.slug, title: st.name } })}
                      style={s.store}>
                      <Image source={st.logo ?? undefined} style={s.storeLogo} contentFit="cover" />
                      <Text style={s.storeName} numberOfLines={1}>
                        {st.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: S.l, paddingTop: S.s, gap: S.s },
  wordmark: { width: 150, height: 24 },
  hello: { fontSize: 20, fontWeight: '700', color: C.text, marginTop: S.s },
  search: { marginTop: S.xs },
  slideWrap: { width: W, paddingHorizontal: S.l, marginTop: S.l },
  slide: { height: 190, borderRadius: R.l, overflow: 'hidden', backgroundColor: C.deep, justifyContent: 'flex-end' },
  slideShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' },
  slideText: { padding: S.l, gap: 2 },
  slideTitle: { color: '#fff', fontSize: 22, fontWeight: '300' },
  slideSub: { color: '#fff', fontSize: 13 },
  slideLink: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: S.xs },
  chip: { backgroundColor: C.card, borderRadius: 999, borderWidth: 1, borderColor: C.line, paddingHorizontal: S.l, paddingVertical: S.s },
  chipText: { color: C.text, fontSize: 14, fontWeight: '500' },
  store: { width: 84, alignItems: 'center', gap: S.xs },
  storeLogo: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.line },
  storeName: { fontSize: 12, color: C.text },
});
