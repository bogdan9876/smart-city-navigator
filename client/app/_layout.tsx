import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import "../global.css";
import * as SecureStore from 'expo-secure-store';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import AppSplash from '@/shared/ui/AppSplash';
import { useColorScheme } from '@/shared/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

const tokenCache = {
  async getToken(key: string) {
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  async saveToken(key: string, value: string) {
    try { return await SecureStore.setItemAsync(key, value); } catch { return; }
  },
};

export const LocationReadyContext = createContext<() => void>(() => {});

const InitialLayout = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [shouldDismiss, setShouldDismiss] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const minTimePassed = useRef(false);
  const locationReady = useRef(false);

  const tryDismiss = useCallback(() => {
    if (minTimePassed.current && locationReady.current) setShouldDismiss(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      minTimePassed.current = true;
      tryDismiss();
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  const dismissSplash = useCallback(() => {
    locationReady.current = true;
    tryDismiss();
  }, [tryDismiss]);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in' as any);
      locationReady.current = true;
      tryDismiss();
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)' as any);
    }
  }, [isSignedIn, isLoaded, segments, router]);

  return (
    <LocationReadyContext.Provider value={dismissSplash}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
      {splashVisible && (
        <AppSplash shouldDismiss={shouldDismiss} onDone={() => setSplashVisible(false)} />
      )}
    </LocationReadyContext.Provider>
  );
};

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <InitialLayout />
    </ClerkProvider>
  );
}
