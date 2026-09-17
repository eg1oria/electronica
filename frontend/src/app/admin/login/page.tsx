import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/admin/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="text-h2 font-bold tracking-tight">
          Nova<span className="text-accent">Link</span>
          <span className="ml-2 text-base font-medium text-muted">admin</span>
        </p>
        <h1 className="mt-8 text-h2 font-semibold">Вход в админку</h1>
        <LoginForm />
      </div>
    </div>
  );
}
