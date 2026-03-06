"use client";

import { useMemo, useState, useTransition } from "react";
import { fetchCaptionsPage, type CaptionRow } from "./actions";

const PAGE_SIZE = 200;

function formatUtc(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

export default function CaptionsClient({
  initialRows,
}: {
  initialRows: CaptionRow[];
}) {
  const [rows, setRows] = useState<CaptionRow[]>(initialRows);
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
        const next = await fetchCaptionsPage(nextPage);
        setRows((prev) => [...prev, ...next]);
        setPage(nextPage);
        if (next.length < PAGE_SIZE) setHasMore(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load more captions");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3">
        {rows.map((c) => {
          const content = (c.content ?? "").trim();
          const preview =
            content.length > 320 ? `${content.slice(0, 320)}…` : content || "(empty)";

          return (
            <div
              key={c.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-900 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {formatUtc(c.created_datetime_utc)}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {c.is_featured ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                      featured
                    </span>
                  ) : null}
                  {c.is_public ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200">
                      public
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                      private
                    </span>
                  )}
                  <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white dark:bg-white dark:text-black">
                    {nf.format(Number(c.like_count ?? 0))} likes
                  </span>
                </div>
              </div>

              <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-900 dark:text-zinc-50">
                {preview}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-zinc-600 dark:text-zinc-400 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  caption_id: <span className="font-mono">{c.id}</span>
                </div>
                <div>
                  profile_id: <span className="font-mono">{c.profile_id}</span>
                </div>
                <div>
                  image_id: <span className="font-mono">{c.image_id}</span>
                </div>
                <div>
                  humor_flavor_id:{" "}
                  <span className="font-mono">{c.humor_flavor_id ?? "—"}</span>
                </div>
                <div>
                  caption_request_id:{" "}
                  <span className="font-mono">{c.caption_request_id ?? "—"}</span>
                </div>
                <div>
                  llm_prompt_chain_id:{" "}
                  <span className="font-mono">{c.llm_prompt_chain_id ?? "—"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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

