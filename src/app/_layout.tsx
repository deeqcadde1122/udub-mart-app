import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/lib/auth';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { C } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: C.accent, background: C.bg } };

function Screens() {
  const { t, ready: langReady } = useI18n();
  const { ready } = useAuth();
  useEffect(() => {
    if (ready && langReady) SplashScreen.hideAsync();
  }, [ready, langReady]);
  if (!ready || !langReady) return null;
  return (
    <Stack
      screenOptions={{
        headerTintColor: C.accent,
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: C.bg },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ presentation: 'modal', title: t('signIn') }} />
      <Stack.Screen name="verify" options={{ presentation: 'modal', title: t('verify') }} />
      <Stack.Screen
        name="name"
        options={{ presentation: 'modal', title: t('yourName'), headerBackVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen name="p/[slug]" options={{ title: '' }} />
      <Stack.Screen name="products" options={{ title: '' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <I18nProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Screens />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
