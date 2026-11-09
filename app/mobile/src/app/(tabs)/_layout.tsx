import { Tabs } from 'expo-router';
import { ClipboardList, Menu } from 'lucide-react-native';
import { useCSSVariable } from 'uniwind';

function asColor(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export default function TabsLayout() {
  const bg = asColor(useCSSVariable('--surface-overlay'));
  const border = asColor(useCSSVariable('--line'));
  const activeTint = asColor(useCSSVariable('--accent'));
  const inactiveTint = asColor(useCSSVariable('--text-muted'));

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
