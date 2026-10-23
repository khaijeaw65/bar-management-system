import { Card } from "@heroui/react";
import type { ReactNode } from "react";

export function EditorCard({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-heading">{title}</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">{children}</Card.Content>
    </Card>
  );
}
