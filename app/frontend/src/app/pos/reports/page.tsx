import { ReportsTabs } from "./_components/ReportsTabs";

export default function ReportsPage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">รายงาน</h1>
      <ReportsTabs />
    </section>
  );
}
