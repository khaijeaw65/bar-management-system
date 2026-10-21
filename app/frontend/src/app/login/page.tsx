import { Suspense } from "react";
import { LoginScreen } from "./_components/LoginScreen";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg-app p-6">
      <Suspense fallback={null}>
        <LoginScreen />
      </Suspense>
    </main>
  );
}
