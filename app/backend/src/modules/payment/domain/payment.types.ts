import type {
  PaymentConfirmedVia,
  PaymentMethod,
  PaymentStatus,
  PaymentStatusReason,
} from '@bar/contracts';

export interface PaymentRecord {
  id: string;
  attemptId: string;
  visitId: string;
  partNo: number;
  partCount: number;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  confirmedVia: PaymentConfirmedVia | null;
  slipTransRef: string | null;
  slipAmount: string | null;
  statusReason: PaymentStatusReason | null;
  statusNote: string | null;
  qrPayload: string | null;
  expiresAt: Date | null;
  paidAt: Date | null;
  /** NULL = staff created; set = the guest phone that created it (BRIEF-052). */
  guestSessionId: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
}

export interface NewPayment {
  visitId: string;
  attemptId: string;
  partNo: number;
  partCount: number;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  confirmedVia: PaymentConfirmedVia | null;
  statusReason: PaymentStatusReason | null;
  statusNote: string | null;
  qrPayload: string | null;
  expiresAt: Date | null;
  paidAt: Date | null;
  guestSessionId?: string | null;
}

export interface TodayPaymentRecord {
  id: string;
  visitId: string;
  seatLabel: string;
  partNo: number;
  partCount: number;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  confirmedVia: PaymentConfirmedVia | null;
  slipTransRef: string | null;
  statusReason: PaymentStatusReason | null;
  paidAt: Date | null;
  createdAt: Date;
}
