import { SettingsNav } from "./_components/SettingsNav";

export default function SettingsLayout({ children }: LayoutProps<"/pos/settings">) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <SettingsNav />
      {children}
    </div>
  );
}
