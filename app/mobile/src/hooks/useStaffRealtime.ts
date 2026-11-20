import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from 'heroui-native';
import { OrderCreatedPayloadSchema } from '@bar/contracts';
import {
  connectStaffSocket,
  disconnectStaffSocket,
  ensureStaffSocketConnected,
  subscribeStaffEvents,
} from '../lib/realtime/socket';
import { markNewOrder, resetNewOrders } from '../lib/realtime/new-orders';
import { activeLineCount, newOrderToast } from '../lib/tickets/copy';
import { QUEUE_KEY } from './useTicketQueue';

export function realtimeEnabled(): boolean {
  return process.env.EXPO_PUBLIC_USE_MOCKS !== '1';
}

/**
 * Live queue for the signed-in area (mounted by the tabs layout). Events only notify:
 * every event refetches the queue — no cache patching from payloads (brief §7).
 */
export function useStaffRealtime(): void {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const showRef = useRef(toast.show);
  showRef.current = toast.show;

  useEffect(() => {
    if (!realtimeEnabled()) return undefined;
    const refetchQueue = () => queryClient.invalidateQueries({ queryKey: QUEUE_KEY });

    const unsubscribe = subscribeStaffEvents({
      onOrderCreated: (payload) => {
        void refetchQueue();
        const order = OrderCreatedPayloadSchema.safeParse(payload);
        if (!order.success) return;
        const [first] = order.data.tickets;
        markNewOrder(order.data.tickets.map((t) => t.id));
        if (first) {
          showRef.current({ variant: 'default', ...newOrderToast(first.seat.label, activeLineCount(order.data.tickets)) });
        }
      },
      onTicketStatusChanged: () => {
        void refetchQueue();
      },
      onReconnect: () => {
        void refetchQueue();
      },
    });
    void connectStaffSocket();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') ensureStaffSocketConnected();
    });

    return () => {
      unsubscribe();
      appState.remove();
      disconnectStaffSocket();
      resetNewOrders();
    };
  }, [queryClient]);
}
