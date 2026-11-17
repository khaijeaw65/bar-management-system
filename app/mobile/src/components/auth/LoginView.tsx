import { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, Button, Spinner } from 'heroui-native';
import {
  signIn,
  AuthCancelledError,
  AuthNotRegisteredError,
} from '../../lib/auth/session';

export type LoginState =
  | 'default'
  | 'signing_in'
  | 'failed'
  | 'not_registered'
  | 'signed_out';

interface LoginViewProps {
  initialReason?: string;
}

function LoginAlert({ state }: { state: LoginState }) {
  if (state === 'failed') {
    return (
      <Alert status="danger" className="w-full">
        <Alert.Content>
          <Alert.Title className="text-sm font-bold font-sans">เข้าสู่ระบบไม่สำเร็จ</Alert.Title>
          <Alert.Description className="text-xs font-sans">
            ลองอีกครั้ง หากยังไม่ได้ ให้ตรวจว่าเปิดแอป LINE ในเครื่องนี้แล้ว
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }
  if (state === 'not_registered') {
    return (
      <Alert status="warning" className="w-full">
        <Alert.Content>
          <Alert.Title className="text-sm font-bold font-sans">
            บัญชี LINE นี้ยังไม่ได้ลงทะเบียน
          </Alert.Title>
          <Alert.Description className="text-xs font-sans">
            ส่งคำขอเข้าใช้งานถึงเจ้าของร้านแล้ว เข้าสู่ระบบอีกครั้งเมื่อได้รับอนุมัติ
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }
  if (state === 'signed_out') {
    return (
      <Alert status="warning" className="w-full">
        <Alert.Content>
          <Alert.Title className="text-sm font-bold font-sans">ออกจากระบบแล้ว</Alert.Title>
          <Alert.Description className="text-xs font-sans">
            เข้าสู่ระบบอีกครั้งเพื่อทำงานต่อ — เกิดเมื่อออกจากระบบเอง เจ้าของร้านถอนสิทธิ์เครื่องนี้ หรือไม่ได้เปิดแอปเกิน 30 วัน
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }
  return null;
}

function getButtonLabel(state: LoginState): string {
  if (state === 'failed') return 'ลองอีกครั้ง';
  if (state === 'not_registered') return 'กลับไปหน้าเข้าสู่ระบบ';
  return 'เข้าสู่ระบบด้วย LINE';
}

export function LoginView({ initialReason }: LoginViewProps) {
  const router = useRouter();
  const [state, setState] = useState<LoginState>(
    initialReason === 'signed_out' ? 'signed_out' : 'default',
  );

  const handleAction = async () => {
    if (state === 'not_registered') {
      setState('default');
      return;
    }

    setState('signing_in');
    try {
      await signIn();
      router.replace('/(tabs)/orders');
    } catch (err) {
      const errName = err instanceof Error ? err.name : '';
      if (err instanceof AuthCancelledError || errName === 'AuthCancelledError') {
        setState('default');
      } else if (err instanceof AuthNotRegisteredError || errName === 'AuthNotRegisteredError') {
        setState('not_registered');
      } else {
        setState('failed');
      }
    }
  };

  const isPending = state === 'signing_in';

  return (
    <View className="flex-1 bg-bg-app justify-between p-6">
      <View className="flex-1 justify-center items-center gap-6">
        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-text-body font-sans">The Loft Bar</Text>
          <Text className="text-base text-text-muted font-sans">ระบบจัดการบาร์</Text>
        </View>

        <LoginAlert state={state} />

        <Button
          testID="login-button"
          className="w-full bg-accent rounded-xl items-center justify-center min-h-[52px]"
          isDisabled={isPending}
          onPress={handleAction}
        >
          {isPending ? (
            <View className="flex-row items-center gap-2">
              <Spinner testID="login-spinner" size="sm" className="text-text-on-accent" />
              <Button.Label className="text-base font-bold text-text-on-accent font-sans">
                กำลังเปิด LINE เพื่อยืนยันตัวตน
              </Button.Label>
            </View>
          ) : (
            <Button.Label className="text-base font-bold text-text-on-accent font-sans">
              {getButtonLabel(state)}
            </Button.Label>
          )}
        </Button>
      </View>

      <Text className="text-center text-xs text-text-faint font-sans pb-4">
        {state === 'not_registered' ? 'ติดต่อเจ้าของร้านหากรอนาน' : 'เฉพาะพนักงาน The Loft Bar'}
      </Text>
    </View>
  );
}
