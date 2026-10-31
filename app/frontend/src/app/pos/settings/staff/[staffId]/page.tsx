import { StaffDetailScreen } from "../_components/StaffDetailScreen";

export default async function StaffDetailPage({ params }: Readonly<PageProps<"/pos/settings/staff/[staffId]">>) {
  const { staffId } = await params;
  return <StaffDetailScreen staffId={staffId} />;
}
