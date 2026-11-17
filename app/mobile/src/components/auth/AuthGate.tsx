import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import {
  useSession,
  getSessionExpiredReason,
  clearSessionExpiredReason,
} from '../../lib/auth/session';

export function AuthGate() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inTabsGroup = segments[0] === '(tabs)';
    if (!session && inTabsGroup) {
      if (getSessionExpiredReason()) {
        clearSessionExpiredReason();
        router.replace('/login?reason=signed_out');
      } else {
        router.replace('/login');
      }
    } else if (session && segments[0] === 'login') {
      router.replace('/(tabs)/orders');
    }
  }, [session, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View testID="auth-gate-loading" className="flex-1 bg-bg-app items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
