import { Redirect } from 'expo-router';
import { useSession } from '../lib/auth/session';

export default function Index() {
  const { session } = useSession();
  return <Redirect href={session ? '/(tabs)/orders' : '/login'} />;
}
