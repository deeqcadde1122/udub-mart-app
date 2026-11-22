import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// The sign-in token lives in the phone's secure storage (Keychain / Keystore), never in plain
// storage. The web preview (for development only) falls back to localStorage.
const web = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  if (web) return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string | null): Promise<void> {
  if (web) {
    if (value === null) globalThis.localStorage?.removeItem(key);
    else globalThis.localStorage?.setItem(key, value);
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}
