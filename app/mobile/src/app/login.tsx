import { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, Button, Spinner } from 'heroui-native';
import { signIn } from '../lib/auth/session';

export default function LoginScreen() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsPending(true);
    setError(null);
    try {
      await signIn();
      router.replace('/(tabs)/orders');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง';
      setError(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <View className="flex-1 bg-bg-app justify-between p-6">
      <View className="flex-1 justify-center items-center gap-6">
        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-text-body font-sans">The Loft Bar</Text>
          <Text className="text-base text-text-muted font-sans">ระบบจัดการบาร์</Text>
        </View>

        {error && (
          <Alert status="danger" className="w-full">
            <Alert.Content>
              <Alert.Title className="text-sm font-sans">{error}</Alert.Title>
            </Alert.Content>
          </Alert>
        )}

        <Button
          testID="login-button"
          className="w-full bg-accent rounded-xl items-center justify-center min-h-[52px]"
          isDisabled={isPending}
          onPress={handleLogin}
        >
          {isPending ? (
            <Spinner testID="login-spinner" size="sm" className="text-text-on-accent" />
          ) : (
            <Button.Label className="text-base font-bold text-text-on-accent font-sans">
              เข้าสู่ระบบด้วย LINE
            </Button.Label>
          )}
        </Button>
      </View>

      <Text className="text-center text-xs text-text-faint font-sans pb-4">
        เฉพาะพนักงาน The Loft Bar
      </Text>
    </View>
  );
}
