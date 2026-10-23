import { z } from 'zod';
import { IsoDateTimeSchema, MoneySchema, UuidSchema } from './common.js';

// Owner dashboard (CD-05). Dates are business dates, venue cut-off (DR-014 #4).
export const REPORT_MAX_PERIOD_DAYS = 92;
const DAY_MS = 24 * 3600 * 1000;

const BusinessDateSchema = z.iso.date({ message: 'วันที่ต้องเป็นรูปแบบ YYYY-MM-DD' });

const PeriodShape = { from: BusinessDateSchema, to: BusinessDateSchema };

function checkPeriod(value: { from: string; to: string }, context: z.RefinementCtx): void {
  const days = (Date.parse(value.to) - Date.parse(value.from)) / DAY_MS + 1;
  if (days < 1) {
    context.addIssue({ code: 'custom', path: ['to'], message: 'วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น' });
    return;
  }
  if (days > REPORT_MAX_PERIOD_DAYS) {
    context.addIssue({
      code: 'custom',
      path: ['to'],
      message: `ช่วงเวลาต้องไม่เกิน ${REPORT_MAX_PERIOD_DAYS} วัน`,
    });
  }
}

export const ReportsPeriodQuerySchema = z.object(PeriodShape).superRefine(checkPeriod);
export type ReportsPeriodQuery = z.infer<typeof ReportsPeriodQuerySchema>;

export const ReportItemsSortSchema = z.enum(['top', 'bottom'], {
  message: 'sort ต้องเป็น top หรือ bottom',
});
export type ReportItemsSort = z.infer<typeof ReportItemsSortSchema>;

export const ReportItemsQuerySchema = z
  .object({
    ...PeriodShape,
    sort: ReportItemsSortSchema,
    limit: z.coerce
      .number({ message: 'limit ต้องเป็นตัวเลข' })
      .int('limit ต้องเป็นจำนวนเต็ม')
      .min(1, 'limit ต้องอยู่ระหว่าง 1–20')
      .max(20, 'limit ต้องอยู่ระหว่าง 1–20')
      .default(5),
  })
  .superRefine(checkPeriod);
export type ReportItemsQuery = z.infer<typeof ReportItemsQuerySchema>;

const CountSchema = z.number().int().nonnegative();

export const ReportMethodTotalSchema = z.object({ amount: MoneySchema, count: CountSchema });

const PeriodTotalsShape = {
  from: z.iso.date(),
  to: z.iso.date(),
  revenue: MoneySchema,
  bills: CountSchema,
  // revenue / bills, ฿0 bills left out (CD-05 R6)
  averageBill: MoneySchema,
};

export const ReportSummarySchema = z.object({
  ...PeriodTotalsShape,
  payments: z.object({ promptpay: ReportMethodTotalSchema, cash: ReportMethodTotalSchema }),
  manualConfirmations: CountSchema,
  previous: z.object(PeriodTotalsShape),
});
export type ReportSummary = z.infer<typeof ReportSummarySchema>;

export const ReportDaySchema = z.object({ date: z.iso.date(), revenue: MoneySchema, bills: CountSchema });
export type ReportDay = z.infer<typeof ReportDaySchema>;

export const ReportDailySchema = z.object({ items: z.array(ReportDaySchema) });
export type ReportDaily = z.infer<typeof ReportDailySchema>;

export const ReportItemSchema = z.object({
  menuItemId: UuidSchema,
  name: z.string(),
  quantity: CountSchema,
  revenue: MoneySchema,
});
export type ReportItem = z.infer<typeof ReportItemSchema>;

export const ReportItemsSchema = z.object({ items: z.array(ReportItemSchema) });
export type ReportItems = z.infer<typeof ReportItemsSchema>;

export const ReportHourSchema = z.object({ hour: z.number().int().min(0).max(23), revenue: MoneySchema });

export const ReportOpenSeatSchema = z.object({
  seatLabel: z.string(),
  openedAt: IsoDateTimeSchema,
  total: MoneySchema,
});

export const ReportTodaySchema = z.object({
  businessDate: z.iso.date(),
  revenue: MoneySchema,
  bills: CountSchema,
  // 24 buckets, the first one is the cut-off hour
  hourly: z.array(ReportHourSchema),
  openSeats: z.array(ReportOpenSeatSchema),
  pendingTickets: CountSchema,
  escalatedIssues: CountSchema,
  generatedAt: IsoDateTimeSchema,
});
export type ReportToday = z.infer<typeof ReportTodaySchema>;
