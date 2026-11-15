import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useSession } from '../../lib/auth/session';

export function AuthGate() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inTabsGroup = segments[0] === '(tabs)';
    if (!session && inTabsGroup) {
      router.replace('/login');
    } else if (session && segments[0] === 'login') {
      router.replace('/(tabs)/orders');
    }
  }, [session, isLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

