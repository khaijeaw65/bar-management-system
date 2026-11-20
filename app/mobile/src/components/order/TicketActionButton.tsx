import { Button, Spinner } from 'heroui-native';
import type { Ticket } from '@bar/contracts';
import { useTicketAction } from '../../hooks/useTicketAction';
import { ACTION_LABEL, nextAction } from '../../lib/tickets/next-action';

export interface TicketActionButtonProps {
  ticket: Ticket;
  kitchenOn: boolean;
}

/** The card's one status step, bottom-left, ≤ 190 px (R7, CD-08 §7). No button for issue tickets (M4). */
export function TicketActionButton({ ticket, kitchenOn }: TicketActionButtonProps) {
  const { mutate, isPending } = useTicketAction(ticket.id);
  const action = nextAction(ticket, kitchenOn);
  if (!action) return null;

  return (
    <Button
      testID={`ticket-action-${ticket.id}`}
      variant="primary"
      size="md"
      isDisabled={isPending}
      accessibilityState={{ busy: isPending, disabled: isPending }}
      className="self-start max-w-[190px] min-h-[44px] mt-1 px-5 rounded-xl"
      onPress={() => mutate(action)}
    >
      {isPending && <Spinner size="sm" />}
      <Button.Label className="text-sm font-semibold font-sans">{ACTION_LABEL[action]}</Button.Label>
    </Button>
  );
}
