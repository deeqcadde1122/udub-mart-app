import { router } from 'expo-router';

/** Close the sign-in screens and go back to where the person was. */
export function closeSignIn() {
  if (router.canDismiss()) router.dismissAll();
  else router.replace('/');
}
