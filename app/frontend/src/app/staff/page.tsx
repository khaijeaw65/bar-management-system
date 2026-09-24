export default function StaffPage({ params }: PageProps<"/staff">) {
  void params;
  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <p className="text-text-secondary">หน้าพนักงาน — เร็ว ๆ นี้</p>
    </main>
  );
}
