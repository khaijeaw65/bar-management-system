import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Spinner } from 'heroui-native';
import { useSession } from '../../lib/auth/session';

export default function MoreScreen() {
  const router = useRouter();
  const { session, signOut } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'ออกจากระบบ?',
      'เครื่องนี้จะไม่ได้รับการแจ้งเตือนออเดอร์จนกว่าจะเข้าสู่ระบบอีกครั้ง',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ออกจากระบบ', style: 'destructive', onPress: handleLogout },
      ],
    );
  };

  return (
    <View className="flex-1 bg-bg-app p-6 justify-between">
      <View className="gap-6 pt-12">
        <Text className="text-2xl font-bold text-text-body font-sans">อื่นๆ</Text>
        <View className="bg-surface-card border border-line p-4 rounded-xl gap-1">
          <Text className="text-xs text-text-faint font-sans">พนักงาน</Text>
          <Text className="text-lg font-bold text-text-body font-sans">
            {session?.staffName ?? 'พนักงาน'}
          </Text>
        </View>
      </View>

      <Button
        testID="logout-button"
        className="w-full bg-surface-raised border border-line rounded-xl items-center justify-center min-h-[52px]"
        isDisabled={isLoggingOut}
        onPress={confirmLogout}
      >
        {isLoggingOut ? (
          <Spinner size="sm" className="text-text-danger" />
        ) : (
          <Button.Label className="text-base font-semibold text-text-danger font-sans">
            ออกจากระบบ
          </Button.Label>
        )}
      </Button>
    </View>
  );
}
