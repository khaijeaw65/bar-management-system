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
  statusReason: PaymentStatusReason | null;
  statusNote: string | null;
  qrPayload: string | null;
  expiresAt: Date | null;
  paidAt: Date | null;
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
}
