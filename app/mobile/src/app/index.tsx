import { View, Text } from 'react-native';
import { Button } from 'heroui-native';
import { Beer } from 'lucide-react-native';
import { OrderStatusSchema } from '@bar/contracts';

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black p-4 gap-4">
      <Text className="text-2xl font-bold text-black dark:text-white font-sans">ระบบจัดการบาร์</Text>
      <Beer color="currentColor" size={24} className="text-black dark:text-white" />
      <Button>เข้าสู่ระบบด้วย LINE</Button>
      <Text className="text-gray-500 font-sans">Status test: {OrderStatusSchema.enum.pending}</Text>
    </View>
  );
}
