import { z } from 'zod';

// One schema per CREATE TYPE in docs/schema.sql. Values are the SQL tokens.
// There is no order_item_status: cancellation is order_item.cancelled_at
// (DR-012 / DR-013), not a status enum.

export const IdentityProviderSchema = z.enum(['line', 'phone_otp']);
export type IdentityProvider = z.infer<typeof IdentityProviderSchema>;

export const TableSeatKindSchema = z.enum(['table', 'counter']);
export type TableSeatKind = z.infer<typeof TableSeatKindSchema>;

export const VisitStateSchema = z.enum([
  'open',
  'active',
  'idle',
  'closed',
  'abandoned',
]);
export type VisitState = z.infer<typeof VisitStateSchema>;

export const VisitOpenSourceSchema = z.enum(['pos', 'app', 'qr']);
export type VisitOpenSource = z.infer<typeof VisitOpenSourceSchema>;

export const ItemTypeSchema = z.enum(['simple', 'recipe', 'charge']);
export type ItemType = z.infer<typeof ItemTypeSchema>;

export const OrderStatusSchema = z.enum([
  'pending',
  'accepted',
  'ready',
  'sent',
  'issue',
  'cancelled',
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const KitchenStationSchema = z.enum(['bar', 'food']);
export type KitchenStation = z.infer<typeof KitchenStationSchema>;

export const PaymentMethodSchema = z.enum(['promptpay', 'cash']);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const PaymentStatusSchema = z.enum([
  'pending',
  'completed',
  'failed',
  'refunded',
  'cancelled',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const BottleKeepStatusSchema = z.enum(['active', 'finished']);
export type BottleKeepStatus = z.infer<typeof BottleKeepStatusSchema>;

export const VenuePaymentModeSchema = z.enum(['own_promptpay', 'gateway']);
export type VenuePaymentMode = z.infer<typeof VenuePaymentModeSchema>;

export const PromptpayIdTypeSchema = z.enum([
  'mobile',
  'national_id',
  'ewallet',
]);
export type PromptpayIdType = z.infer<typeof PromptpayIdTypeSchema>;

export const PaymentConfirmedViaSchema = z.enum([
  'webhook',
  'manual',
  'cash',
  'slip_verify',
]);
export type PaymentConfirmedVia = z.infer<typeof PaymentConfirmedViaSchema>;

// VARCHAR on payment.status_reason, not a SQL enum. CD-03 F1.
export const PaymentStatusReasonSchema = z.enum([
  'staff_cancel',
  'expired',
  'webhook_missing',
  'direct_transfer',
  'other',
]);
export type PaymentStatusReason = z.infer<typeof PaymentStatusReasonSchema>;

export const AiInsightKindSchema = z.enum(['sales_summary', 'anomaly', 'menu']);
export type AiInsightKind = z.infer<typeof AiInsightKindSchema>;

export const InvCategorySchema = z.enum(['A', 'B', 'C']);
export type InvCategory = z.infer<typeof InvCategorySchema>;

export const InvTxTypeSchema = z.enum([
  'purchase',
  'usage',
  'adjustment',
  'void',
]);
export type InvTxType = z.infer<typeof InvTxTypeSchema>;

export const AuditActionSchema = z.enum(['CREATE', 'UPDATE', 'REJECT']);
export type AuditAction = z.infer<typeof AuditActionSchema>;

export const ActorTypeSchema = z.enum(['user', 'system']);
export type ActorType = z.infer<typeof ActorTypeSchema>;

export const schemaEnumBySqlName = {
  identity_provider: IdentityProviderSchema,
  table_seat_kind: TableSeatKindSchema,
  visit_state: VisitStateSchema,
  visit_open_source: VisitOpenSourceSchema,
  item_type: ItemTypeSchema,
  order_status: OrderStatusSchema,
  kitchen_station: KitchenStationSchema,
  payment_method: PaymentMethodSchema,
  payment_status: PaymentStatusSchema,
  bottle_keep_status: BottleKeepStatusSchema,
  venue_payment_mode: VenuePaymentModeSchema,
  promptpay_id_type: PromptpayIdTypeSchema,
  payment_confirmed_via: PaymentConfirmedViaSchema,
  ai_insight_kind: AiInsightKindSchema,
  inv_category: InvCategorySchema,
  inv_tx_type: InvTxTypeSchema,
  audit_action: AuditActionSchema,
  actor_type: ActorTypeSchema,
} as const;
