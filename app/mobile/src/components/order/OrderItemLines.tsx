import { View, Text } from 'react-native';
import type { Ticket } from '@bar/contracts';

const MAX_LINES = 3;

/** Up to 3 item lines + "+ n รายการ"; cancelled lines struck through (CD-08 §9). */
export function OrderItemLines({ items }: Readonly<{ items: Ticket['items'] }>) {
  const remainingCount = items.length - MAX_LINES;
  return (
    <View className="gap-1 mt-1">
      {items.slice(0, MAX_LINES).map((item) => {
        const isCancelled = item.cancelledAt !== null;
        return (
          <Text
            key={item.id}
            numberOfLines={1}
            testID={isCancelled ? 'cancelled-order-item' : undefined}
            className={`text-sm font-sans ${isCancelled ? 'line-through text-text-faint' : 'text-text-body'}`}
          >
            {item.quantity}× {item.name}
          </Text>
        );
      })}
      {remainingCount > 0 && <Text className="text-xs text-text-faint font-sans">+ {remainingCount} รายการ</Text>}
    </View>
  );
}
