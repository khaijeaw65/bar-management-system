import { Alert } from "@heroui/react";

export function FailureAlert({ message }: Readonly<{ message: string | null }>) {
  if (!message) return null;
  return (
    <Alert status="danger" role="alert">
      <Alert.Content>
        <Alert.Description>{message}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
