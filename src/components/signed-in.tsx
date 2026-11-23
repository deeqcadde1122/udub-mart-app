import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button, Empty, styles as ui } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { S } from '@/lib/theme';

/** Screens with personal data: show a sign-in prompt to signed-out visitors. The real check is
 *  on the server (every personal endpoint answers 401 without a valid token). */
export function SignedIn({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { user } = useAuth();
  if (user) return <>{children}</>;
  return (
    <View style={ui.screen}>
      <Empty title={t('signInToContinue')} text={t('signInWhy')}>
        <Button title={t('signIn')} onPress={() => router.push('/login')} style={{ marginTop: S.xl, alignSelf: 'stretch' }} />
      </Empty>
    </View>
  );
}
