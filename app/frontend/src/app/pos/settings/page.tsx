import { VenueSettingsScreen } from "./_components/VenueSettingsScreen";

export default function SettingsPage() {
  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-xl font-semibold">ตั้งค่าร้าน</h1>
      <VenueSettingsScreen />
    </section>
  );
}
