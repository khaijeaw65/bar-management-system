// Shared enums — import from '@bar/contracts' in both frontend and backend

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum SessionState {
  ACTIVE = 'ACTIVE',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CLOSED = 'CLOSED',
}

export enum StaffRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  BARTENDER = 'BARTENDER',
  WAITER = 'WAITER',
}
