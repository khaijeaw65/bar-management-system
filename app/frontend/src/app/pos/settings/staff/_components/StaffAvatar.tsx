import { Avatar } from "@heroui/react";

export function StaffAvatar({ name, url }: Readonly<{ name: string | null; url: string | null }>) {
  return (
    <Avatar size="md">
      {url ? <Avatar.Image alt="" src={url} /> : null}
      <Avatar.Fallback>{(name ?? "?").trim().slice(0, 1).toUpperCase()}</Avatar.Fallback>
    </Avatar>
  );
}
