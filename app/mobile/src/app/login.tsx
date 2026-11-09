import { useLocalSearchParams } from 'expo-router';
import { LoginView } from '../components/auth/LoginView';

export default function LoginScreen() {
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  return <LoginView initialReason={reason} />;
}
