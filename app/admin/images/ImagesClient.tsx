"use client";

import { useMemo, useState, useTransition } from "react";
import { fetchImagesPage, type ImageRow } from "./actions";
import ImageEditor from "./ImageEditor";

const PAGE_SIZE = 100;

export default function ImagesClient({ initialRows }: { initialRows: ImageRow[] }) {
  const [rows, setRows] = useState<ImageRow[]>(initialRows);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialRows.length === PAGE_SIZE);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nf = useMemo(() => new Intl.NumberFormat("en-US"), []);

  function loadMore() {
    if (!hasMore || isPending) return;
    setError(null);
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const next = await fetchImagesPage(nextPage);
        setRows((prev) => [...prev, ...next]);
        setPage(nextPage);
        if (next.length < PAGE_SIZE) setHasMore(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load more images");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-1 gap-3">
        {rows.map((img) => (
          <ImageEditor
            key={img.id}
            id={img.id}
            createdAt={img.created_datetime_utc}
            initialUrl={img.url}
            initialIsPublic={img.is_public}
            initialIsCommonUse={img.is_common_use}
            initialAdditionalContext={img.additional_context}
            initialImageDescription={img.image_description}
            initialCelebrityRecognition={img.celebrity_recognition}
            onDeleted={() => setRows((prev) => prev.filter((r) => r.id !== img.id))}
          />
        ))}
      </section>

      <div className="flex items-center justify-between gap-4">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Showing {nf.format(rows.length)} loaded
        </div>

        <button
          type="button"
          onClick={loadMore}
          disabled={!hasMore || isPending}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          {hasMore ? (isPending ? "Loading…" : "Load more") : "No more"}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}

