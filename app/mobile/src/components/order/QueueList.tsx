import { useMemo } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import type { Ticket } from '@bar/contracts';
import { OrderCard } from './OrderCard';
import { TicketActionButton } from './TicketActionButton';
import { splitOrderIds } from '../../lib/tickets/seat-line';

export interface QueueListProps {
  /** Cards to show (after the filter). */
  tickets: Ticket[];
  /** Every ticket in the queue — split detection must not depend on the filter. */
  allTickets: Ticket[];
  highlighted: ReadonlySet<string>;
  /** Venue mode, or null while unknown (no buttons until known). */
  kitchenOn: boolean | null;
  canAct: boolean;
  isRefetching: boolean;
  onRefresh: () => void;
}

export function QueueList({ tickets, allTickets, highlighted, kitchenOn, canAct, isRefetching, onRefresh }: Readonly<QueueListProps>) {
  const split = useMemo(() => splitOrderIds(allTickets), [allTickets]);

  return (
    <FlatList
      data={tickets}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <OrderCard
          ticket={item}
          isSplit={split.has(item.orderId)}
          highlighted={highlighted.has(item.id)}
          footer={canAct && kitchenOn !== null ? <TicketActionButton ticket={item} kitchenOn={kitchenOn} /> : null}
        />
      )}
      contentContainerClassName="p-4 gap-3 pb-40"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View className="py-20 items-center justify-center">
          <Text className="text-sm text-text-faint font-sans">ยังไม่มีออเดอร์</Text>
        </View>
      }
    />
  );
}
