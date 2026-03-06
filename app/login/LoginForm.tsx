"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/admin";
  const reason = searchParams.get("reason");
  const queryError = searchParams.get("error");

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onGoogle() {
    setError(null);
    setLoading(true);

    const callbackUrl = new URL("/auth/callback", window.location.origin);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    // Usually the browser navigates away; if it doesn't, show error.
    if (error) {
      setLoading(false);
      setError(error.message);
    }
  }

  return (
    <div
      className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Admin sign in
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Sign in with Google to continue. Only superadmins can access the admin area.
        </p>
      </div>

      {reason === "not_superadmin" ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          Your account is signed in, but it isn’t marked as a superadmin.
        </div>
      ) : null}

      {queryError ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {queryError}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-4">
        <button
          type="button"
          onClick={onGoogle}
          disabled={loading}
          className="h-11 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          Continue with Google
        </button>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}

