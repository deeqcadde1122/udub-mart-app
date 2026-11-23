import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/lib/auth';
import { appHref } from '@/lib/links';
import { pushLink, registerForPush } from '@/lib/push';

/** Registers this phone for pushes once someone is signed in with alerts on, and opens the right
 *  screen when a push is tapped (also when the tap started the app). Renders nothing. */
export function PushSetup() {
  const { user } = useAuth();
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !user.notifyOn || registeredFor.current === user.id) return;
    registeredFor.current = user.id;
    registerForPush();
  }, [user]);

  const last = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!last || handled.current === last.notification.request.identifier) return;
    handled.current = last.notification.request.identifier;
    const link = pushLink(last.notification);
    if (link) router.push(appHref(link));
  }, [last]);

  return null;
}
