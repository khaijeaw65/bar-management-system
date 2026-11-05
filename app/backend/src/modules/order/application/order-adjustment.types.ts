export interface AdjustmentOutcome {
  orderId: string;
  ticketId: string;
  visitId: string;
  ticketCancelled: boolean;
  adjustedAt: Date;
}
