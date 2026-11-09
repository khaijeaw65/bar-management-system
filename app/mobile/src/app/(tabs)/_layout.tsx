import { Tabs } from 'expo-router';
import { ClipboardList, Menu } from 'lucide-react-native';
import { useCSSVariable } from 'uniwind';

export default function TabsLayout() {
  const bg = useCSSVariable('--surface-overlay') as string;
  const border = useCSSVariable('--line') as string;
  const activeTint = useCSSVariable('--accent') as string;
  const inactiveTint = useCSSVariable('--text-muted') as string;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: bg,
          borderTopColor: border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
      }}
    >
      <Tabs.Screen
        name="orders"
        options={{
          title: 'ออเดอร์',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'อื่นๆ',
          tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
