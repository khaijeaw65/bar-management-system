import { useState, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, ScrollView, Pressable } from 'react-native';
import { Alert, Button, Skeleton } from 'heroui-native';
import { useTicketQueue } from '../../hooks/useTicketQueue';
import { OrderCard } from '../../components/order/OrderCard';

type FilterStatus = 'all' | 'pending' | 'accepted' | 'ready' | 'issue';

const FILTERS: { id: FilterStatus; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'pending', label: 'ใหม่' },
  { id: 'accepted', label: 'กำลังเตรียม' },
  { id: 'ready', label: 'พร้อมเสิร์ฟ' },
  { id: 'issue', label: 'มีปัญหา' },
];

export default function OrdersScreen() {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const { data, isLoading, isError, isRefetching, refetch } = useTicketQueue();

  const tickets = useMemo(() => {
    const valid = (data?.items ?? []).filter((t) => t.status !== 'sent' && t.status !== 'cancelled');
    const sorted = [...valid].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return filter === 'all' ? sorted : sorted.filter((t) => t.status === filter);
  }, [data, filter]);

  const hasIssue = useMemo(
    () => (data?.items ?? []).some((t) => t.status === 'issue'),
    [data],
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg-app p-4 pt-12 gap-3">
        <Text className="text-2xl font-bold text-text-body font-sans mb-2">ออเดอร์</Text>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} isLoading className="h-28 rounded-xl bg-surface-card" />
        ))}
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-bg-app justify-center items-center p-6 gap-4">
        <Alert status="danger" className="w-full">
          <Alert.Content>
            <Alert.Title className="text-sm font-sans">โหลดออเดอร์ไม่สำเร็จ</Alert.Title>
          </Alert.Content>
        </Alert>
        <Button className="bg-surface-raised border border-line px-6 py-3 rounded-xl min-h-[44px]" onPress={() => refetch()}>
          <Button.Label className="text-sm font-semibold text-text-body font-sans">ลองอีกครั้ง</Button.Label>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-app pt-12">
      <Text className="text-2xl font-bold text-text-body font-sans px-4 mb-3">ออเดอร์</Text>
      <View className="pb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-4 gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <Pressable
                key={f.id}
                testID={`filter-${f.id}`}
                onPress={() => setFilter(f.id)}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border min-h-[36px] ${
                  active ? 'bg-accent-soft border-accent' : 'bg-surface-card border-line'
                }`}
              >
                <Text className={`text-xs font-semibold font-sans ${active ? 'text-text-accent' : 'text-text-muted'}`}>
                  {f.label}
                </Text>
                {f.id === 'issue' && hasIssue && <View className="w-1.5 h-1.5 rounded-full bg-status-void" />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard ticket={item} />}
        contentContainerClassName="p-4 gap-3"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View className="py-20 items-center justify-center">
            <Text className="text-sm text-text-faint font-sans">ยังไม่มีออเดอร์</Text>
          </View>
        }
      />
    </View>
  );
}
