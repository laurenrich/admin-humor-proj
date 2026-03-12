"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createImage } from "./actions";

export default function CreateImageClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const url = String(fd.get("url") ?? "").trim();
    const file = fd.get("file");
    const hasFile = file instanceof File && file.size > 0;

    if (!hasFile && !url) {
      setError("Provide a URL or upload a file.");
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    startTransition(async () => {
      const res = await createImage(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      form.reset();
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
      <h2 className="text-base font-semibold">Create image</h2>
      <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Upload file (optional)
          </span>
          <input
            name="file"
            type="file"
            accept="image/*"
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:file:bg-zinc-900 dark:file:text-zinc-50 dark:hover:file:bg-zinc-800"
          />
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Or URL</span>
          <input
            name="url"
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            placeholder="https://..."
          />
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Provide either a file or a URL. If both are provided, the file will be used.
          </span>
        </label>

        <div className="flex flex-wrap gap-4 md:col-span-2">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" name="is_public" />
            Public
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" name="is_common_use" />
            Common use
          </label>
        </div>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Additional context
          </span>
          <textarea
            name="additional_context"
            rows={3}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Image description
          </span>
          <textarea
            name="image_description"
            rows={3}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Celebrity recognition
          </span>
          <textarea
            name="celebrity_recognition"
            rows={3}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>

        <div className="md:col-span-2 flex items-center justify-end">
          <button
            disabled={isPending}
            className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
          >
            {isPending ? "Creating…" : "Create"}
          </button>
        </div>
      </form>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}
    </section>
  );
}

