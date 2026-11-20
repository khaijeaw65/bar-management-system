import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useToast } from 'heroui-native';
import type { Ticket, TicketList } from '@bar/contracts';
import { ApiError } from '../lib/api/client';
import { getTicketQueue, transitionTicket } from '../lib/api/tickets';
import type { NextAction } from '../lib/tickets/next-action';
import { QUEUE_COPY, servedToast, takenTitle } from '../lib/tickets/copy';
import { QUEUE_KEY } from './useTicketQueue';
import { PERMISSIONS_KEY } from './useMyPermissions';

type ShowToast = ReturnType<typeof useToast>['toast']['show'];

function replaceTicket(list: TicketList, updated: Ticket): TicketList {
  if (updated.status === 'sent') {
    return { items: list.items.filter((t) => t.id !== updated.id) };
  }
  return { items: list.items.map((t) => (t.id === updated.id ? updated : t)) };
}

/** R14: the 409 has no body — read the latest ticket from a refetch, then explain it. */
async function explainConflict(qc: QueryClient, show: ShowToast, ticketId: string, action: NextAction) {
  const fresh = await qc.fetchQuery({ queryKey: QUEUE_KEY, queryFn: getTicketQueue, staleTime: 0 });
  const current = fresh.items.find((t) => t.id === ticketId);
  const takenBySomeoneElse =
    action === 'accept' && current?.acceptedBy && (current.status === 'accepted' || current.status === 'ready');
  if (current && takenBySomeoneElse && current.acceptedBy) {
    show({
      variant: 'default',
      label: takenTitle(current.acceptedBy.displayName, current.orderNumber),
      description: QUEUE_COPY.takenBody,
      duration: 'persistent',
    });
    return;
  }
  show({ variant: 'warning', label: QUEUE_COPY.staleTitle, description: QUEUE_COPY.staleBody, duration: 'persistent' });
}

async function handleActionError(qc: QueryClient, show: ShowToast, error: Error, ticketId: string, action: NextAction) {
  if (error instanceof ApiError && error.status === 409) {
    await explainConflict(qc, show, ticketId, action).catch(() => {
      show({ variant: 'warning', label: QUEUE_COPY.staleTitle, description: QUEUE_COPY.staleBody, duration: 'persistent' });
    });
    return;
  }
  if (error instanceof ApiError && error.status === 403) {
    show({ variant: 'warning', label: QUEUE_COPY.readOnly });
    await Promise.all([
      qc.invalidateQueries({ queryKey: PERMISSIONS_KEY }),
      qc.invalidateQueries({ queryKey: QUEUE_KEY }),
    ]);
    return;
  }
  show({ variant: 'danger', label: QUEUE_COPY.saveFailedTitle, description: QUEUE_COPY.saveFailedBody });
}

/** One status step on one card: accept / ready / send (R7, R9, R14). */
export function useTicketAction(ticketId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Ticket, Error, NextAction>({
    mutationFn: (action) => transitionTicket(ticketId, action),
    onSuccess: (updated, action) => {
      queryClient.setQueryData<TicketList>(QUEUE_KEY, (old) => (old ? replaceTicket(old, updated) : old));
      if (action === 'send') {
        toast.show({ variant: 'success', ...servedToast(updated) });
      }
    },
    onError: (error, action) => handleActionError(queryClient, toast.show, error, ticketId, action),
  });
}
