import { ReportItemsQuerySchema, ReportsPeriodQuerySchema } from './reports.js';

describe('ReportsPeriodQuerySchema', () => {
  it('accepts one day and 92 days', () => {
    expect(ReportsPeriodQuerySchema.safeParse({ from: '2026-10-01', to: '2026-10-01' }).success).toBe(true);
    expect(ReportsPeriodQuerySchema.safeParse({ from: '2026-07-01', to: '2026-09-30' }).success).toBe(true);
  });

  it('rejects to before from, 93 days and a bad date, on the right field', () => {
    const backwards = ReportsPeriodQuerySchema.safeParse({ from: '2026-10-02', to: '2026-10-01' });
    const tooLong = ReportsPeriodQuerySchema.safeParse({ from: '2026-07-01', to: '2026-10-01' });
    const badDate = ReportsPeriodQuerySchema.safeParse({ from: '2026-13-01', to: '2026-10-01' });
    expect(backwards.error?.issues[0]?.path).toEqual(['to']);
    expect(tooLong.error?.issues[0]?.path).toEqual(['to']);
    expect(badDate.error?.issues[0]?.path).toEqual(['from']);
  });
});

describe('ReportItemsQuerySchema', () => {
  const period = { from: '2026-10-01', to: '2026-10-07' };

  it('defaults limit to 5 and coerces a query-string number', () => {
    expect(ReportItemsQuerySchema.parse({ ...period, sort: 'top' }).limit).toBe(5);
    expect(ReportItemsQuerySchema.parse({ ...period, sort: 'bottom', limit: '20' }).limit).toBe(20);
  });

  it.each([
    [{ sort: 'best' }, 'sort'],
    [{ sort: 'top', limit: '0' }, 'limit'],
    [{ sort: 'top', limit: '21' }, 'limit'],
    [{ sort: 'top', limit: '2.5' }, 'limit'],
  ])('rejects %o on %s', (extra, field) => {
    const parsed = ReportItemsQuerySchema.safeParse({ ...period, ...extra });
    expect(parsed.error?.issues[0]?.path).toEqual([field]);
  });
});
