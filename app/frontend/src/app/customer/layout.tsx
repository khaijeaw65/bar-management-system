import type { ReactNode } from "react";
import { CustomerShell } from "./_components/CustomerShell";

export default function CustomerLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <CustomerShell>{children}</CustomerShell>;
}
