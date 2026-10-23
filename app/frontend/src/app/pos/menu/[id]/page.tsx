import { MenuEditorScreen } from "../_components/editor/MenuEditorScreen";

export default async function EditMenuItemPage({ params }: Readonly<PageProps<"/pos/menu/[id]">>) {
  const { id } = await params;
  return <MenuEditorScreen id={id} />;
}
