import { WelcomeScreen } from "./_components/WelcomeScreen";

export default async function ScanPage({ params }: Readonly<PageProps<"/scan/[qrToken]">>) {
  const { qrToken } = await params;
  return <WelcomeScreen qrToken={qrToken} />;
}
