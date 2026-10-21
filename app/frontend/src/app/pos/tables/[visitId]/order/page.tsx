import { OrderScreen } from "./_components/OrderScreen";

export default async function OrderPage({ params }: PageProps<"/pos/tables/[visitId]/order">) {
  const { visitId } = await params;
  return <OrderScreen visitId={visitId} />;
}
