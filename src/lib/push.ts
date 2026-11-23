import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from './api';

// Phone pushes (the website sends them: udub-store lib/push.ts). The app only asks permission,
// gets this phone's Expo push token and gives it to the website for the signed-in device
// (POST /push). Signing out ends it on the server.

// While the app is open, still show the banner.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

const projectId = (): string | undefined =>
  (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ?? (Constants.easConfig?.projectId as string | undefined);

/** Ask permission (once — the phone remembers the answer) and register this phone. Quietly does
 *  nothing where pushes can't work: the web preview, a simulator, no EAS project yet, or Expo Go
 *  on Android (which no longer supports remote pushes — a development build does). */
export async function registerForPush(): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return;
  const id = projectId();
  if (!id) return;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'Udub Mart', importance: Notifications.AndroidImportance.HIGH });
    }
    let { granted } = await Notifications.getPermissionsAsync();
    if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    await api('/push', { method: 'POST', body: { token, platform: Platform.OS === 'ios' ? 'ios' : 'android' } });
  } catch {
    // No push on this phone/build: everything else in the app works without it.
  }
}

/** The website path a push points to (the app maps it to a screen with appHref). */
export function pushLink(n: Notifications.Notification | undefined | null): string | null {
  const link = n?.request.content.data?.link;
  return typeof link === 'string' && link.startsWith('/') ? link : null;
}
