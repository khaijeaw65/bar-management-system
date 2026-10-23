import type { ReportDay, ReportItem, ReportSummary, ReportToday } from "@bar/contracts";
import { http, HttpResponse } from "msw";
import { fromSatang, sumMoney, toSatang } from "@/lib/utils/money";

// CD-05 §6 sample: the last 30 days of any period total ฿440,660.00 over 600 bills, Fri / Sat peaks.
const SAMPLE_BILLS = [14, 10, 15, 18, 32, 36, 17, 14, 12, 15, 18, 32, 36, 17, 14, 12, 15, 18, 32, 36, 17, 14, 12, 15, 18, 32, 36, 17, 14, 12];
const SAMPLE_REVENUE = [
  10220, 7300, 10950, 13140, 23360, 26280, 12410, 10220, 8760, 10950, 13140, 24440, 26280, 12410, 10220, 8760, 10950,
  13140, 23360, 26280, 12410, 10220, 8760, 10950, 13140, 23360, 26280, 12410, 10220, 10340,
];

const DAY_MS = 24 * 3600 * 1000;

function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let at = Date.parse(from); at <= Date.parse(to); at += DAY_MS) dates.push(new Date(at).toISOString().slice(0, 10));
  return dates;
}

// The sample is indexed back from the last day, so 30 วัน ending today is exactly the CD-05 sample.
function dailyFor(from: string, to: string): ReportDay[] {
  const dates = datesBetween(from, to);
  return dates.map((date, index) => {
    const back = (dates.length - 1 - index) % SAMPLE_BILLS.length;
    const at = SAMPLE_BILLS.length - 1 - back;
    return { date, revenue: `${SAMPLE_REVENUE[at] ?? 0}.00`, bills: SAMPLE_BILLS[at] ?? 0 };
  });
}

function average(revenue: string, bills: number): string {
  return bills === 0 ? "0.00" : fromSatang(Math.round(toSatang(revenue) / bills));
}

function summaryFor(from: string, to: string): ReportSummary {
  const days = dailyFor(from, to);
  const revenue = sumMoney(days.map((day) => day.revenue));
  const bills = days.reduce((total, day) => total + day.bills, 0);
  const promptpay = fromSatang(Math.round(toSatang(revenue) * 0.72));
  const cash = fromSatang(toSatang(revenue) - toSatang(promptpay));
  // Previous period ≈ 12 % lower, so the tiles show "+12% จากช่วงก่อน".
  const previousRevenue = fromSatang(Math.round(toSatang(revenue) / 1.12));
  const previousBills = Math.round(bills / 1.12);
  const span = days.length * DAY_MS;
  const iso = (at: number) => new Date(at).toISOString().slice(0, 10);
  return {
    from,
    to,
    revenue,
    bills,
    averageBill: average(revenue, bills),
    payments: {
      promptpay: { amount: promptpay, count: Math.round(bills * 0.72) },
      cash: { amount: cash, count: bills - Math.round(bills * 0.72) },
    },
    manualConfirmations: 3,
    previous: {
      from: iso(Date.parse(from) - span),
      to: iso(Date.parse(from) - DAY_MS),
      revenue: previousRevenue,
      bills: previousBills,
      averageBill: average(previousRevenue, previousBills),
    },
  };
}

const item = (n: number, name: string, quantity: number, revenue: string): ReportItem => ({
  menuItemId: `d0000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`,
  name,
  quantity,
  revenue,
});

export const reportTop = [
  item(1, "โอลด์แฟชั่น", 212, "63600.00"),
  item(2, "ลีโอ 4 ขวด + ถังน้ำแข็ง", 118, "46020.00"),
  item(3, "ค็อกเทล 1 แถม 1 (เฉพาะ Happy Hour ก่อนสามทุ่ม)", 160, "38400.00"),
  item(4, "ช้างดราฟต์", 290, "34800.00"),
  item(5, "ปีกไก่ทอดน้ำปลา", 96, "17280.00"),
];

export const reportBottom = [
  item(6, "ยำหมูยอ", 2, "240.00"),
  item(7, "เฟรนช์ฟรายส์ทรัฟเฟิล", 4, "720.00"),
  item(8, "มอคเทลเสาวรส", 5, "600.00"),
  item(9, "ไวน์แดง (แก้ว)", 7, "1540.00"),
  item(10, "ข้าวผัดกระเพรา", 9, "1080.00"),
];

const HOURS = Array.from({ length: 24 }, (_, index) => (6 + index) % 24);
const TODAY_SALES: Record<number, string> = { 18: "1240.00", 19: "3180.00", 20: "5460.00", 21: "8540.00" };

// 21:14 Bangkok on the current day, so the hourly window and open times stay stable.
function sampleNow(): number {
  const now = new Date();
  now.setUTCHours(14, 14, 0, 0);
  return now.getTime();
}

export function todaySample(): ReportToday {
  const now = sampleNow();
  const opened = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
  return {
    businessDate: new Date(now).toISOString().slice(0, 10),
    revenue: "18420.00",
    bills: 25,
    hourly: HOURS.map((hour) => ({ hour, revenue: TODAY_SALES[hour] ?? "0.00" })),
    openSeats: [
      { seatLabel: "T4", openedAt: opened(205), total: "2340.00" },
      { seatLabel: "C5", openedAt: opened(190), total: "980.00" },
      { seatLabel: "T1", openedAt: opened(120), total: "1860.00" },
      { seatLabel: "C1", openedAt: opened(95), total: "420.00" },
      { seatLabel: "T2", openedAt: opened(70), total: "1240.00" },
      { seatLabel: "C2", openedAt: opened(55), total: "360.00" },
      { seatLabel: "T6", openedAt: opened(30), total: "690.00" },
      { seatLabel: "C3", openedAt: opened(12), total: "0.00" },
    ],
    pendingTickets: 3,
    escalatedIssues: 1,
    generatedAt: new Date(now).toISOString(),
  };
}

function json(data: unknown) {
  return HttpResponse.json({ status: 200, code: "", message: "success", data });
}

function period(request: Request): { from: string; to: string } {
  const params = new URL(request.url).searchParams;
  return { from: params.get("from") ?? "", to: params.get("to") ?? "" };
}

export const reportHandlers = [
  http.get("*/api/reports/summary", ({ request }) => {
    const { from, to } = period(request);
    return json(summaryFor(from, to));
  }),
  http.get("*/api/reports/daily", ({ request }) => {
    const { from, to } = period(request);
    return json({ items: dailyFor(from, to) });
  }),
  http.get("*/api/reports/items", ({ request }) => {
    const sort = new URL(request.url).searchParams.get("sort");
    return json({ items: sort === "bottom" ? reportBottom : reportTop });
  }),
  http.get("*/api/reports/today", () => json(todaySample())),
];
