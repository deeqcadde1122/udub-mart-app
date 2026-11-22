import { Tabs } from 'expo-router/js-tabs';

import { useI18n } from '@/lib/i18n';
import { C } from '@/lib/theme';

// Native tabs don't run in a browser; the web preview (development only) uses plain tabs.
export default function TabsLayout() {
  const { t } = useI18n();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: C.accent }}>
      <Tabs.Screen name="index" options={{ title: t('home') }} />
      <Tabs.Screen name="categories" options={{ title: t('categories') }} />
      <Tabs.Screen name="cart" options={{ title: t('cart') }} />
      <Tabs.Screen name="account" options={{ title: t('account') }} />
    </Tabs>
  );
}
