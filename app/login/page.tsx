import LoginForm from "./LoginForm";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="h-6 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-4 h-4 w-56 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-6 h-11 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-4 h-11 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-4 h-11 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}

