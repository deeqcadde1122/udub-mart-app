import { NativeTabs } from 'expo-router/native-tabs';

import { useI18n } from '@/lib/i18n';
import { C } from '@/lib/theme';

export default function TabsLayout() {
  const { t } = useI18n();
  return (
    <NativeTabs tintColor={C.accent} labelStyle={{ selected: { color: C.accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="categories">
        <NativeTabs.Trigger.Label>{t('categories')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2" md="grid_view" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cart">
        <NativeTabs.Trigger.Label>{t('cart')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bag" md="shopping_bag" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>{t('account')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
