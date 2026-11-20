import { View, Text } from 'react-native';
import { Alert, Button, Skeleton } from 'heroui-native';
import { useTicketQueue } from '../../hooks/useTicketQueue';
import { useQueueFilter } from '../../hooks/useQueueFilter';
import { useVenue } from '../../hooks/useVenue';
import { useMyPermissions } from '../../hooks/useMyPermissions';
import { useConnectionBanner } from '../../hooks/useConnectionBanner';
import { useNewOrders } from '../../lib/realtime/new-orders';
import { QueueFilterChips } from '../../components/order/QueueFilterChips';
import { QueueNotices } from '../../components/order/QueueNotices';
import { QueueList } from '../../components/order/QueueList';

export default function OrdersScreen() {
  const { data, isLoading, isError, isRefetching, refetch } = useTicketQueue();
  const { filter, setFilter, tickets, hasIssue } = useQueueFilter(data);
  const venue = useVenue();
  const permissions = useMyPermissions();
  const disconnected = useConnectionBanner();
  const { highlighted } = useNewOrders();
  const kitchenOn = venue.data ? venue.data.kitchenDisplayEnabled : null;
  const readOnly = permissions.isSuccess && !permissions.canUpdateStatus;

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg-app p-4 pt-12 gap-3" testID="orders-loading">
        <Text className="text-2xl font-bold text-text-body font-sans mb-2">ออเดอร์</Text>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} testID="order-skeleton" isLoading className="h-28 rounded-xl bg-surface-card" />
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
        <Button
          className="bg-surface-raised border border-line px-6 py-3 rounded-xl min-h-[44px]"
          onPress={() => refetch()}
        >
          <Button.Label className="text-sm font-semibold text-text-body font-sans">ลองอีกครั้ง</Button.Label>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-app pt-12">
      <Text className="text-2xl font-bold text-text-body font-sans px-4 mb-3">ออเดอร์</Text>
      <QueueNotices disconnected={disconnected} readOnly={readOnly} />
      <QueueFilterChips
        currentFilter={filter}
        onSelectFilter={setFilter}
        hasIssue={hasIssue}
        showReady={kitchenOn === true}
      />
      <QueueList
        tickets={tickets}
        allTickets={data?.items ?? []}
        highlighted={highlighted}
        kitchenOn={kitchenOn}
        canAct={permissions.canUpdateStatus}
        isRefetching={isRefetching}
        onRefresh={refetch}
      />
    </View>
  );
}
