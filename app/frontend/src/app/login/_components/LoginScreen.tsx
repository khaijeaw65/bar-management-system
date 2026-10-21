"use client";

import { useSearchParams } from "next/navigation";
import { LoginCard } from "./LoginCard";
import { NotRegisteredCard } from "./NotRegisteredCard";

export function LoginScreen() {
  const error = useSearchParams().get("error");
  if (error === "not_registered") return <NotRegisteredCard />;
  return <LoginCard failed={error === "login_failed"} />;
}
