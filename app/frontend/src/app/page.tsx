import { redirect } from "next/navigation";

export default function Home({ params }: PageProps<"/">) {
  void params;
  redirect("/pos/menu");
}
