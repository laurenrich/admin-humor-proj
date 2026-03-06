"use client";

import { useMemo, useState, useTransition } from "react";
import { fetchProfilesPage, type ProfileRow } from "./actions";

const PAGE_SIZE = 200;

function formatUtc(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

export default function UsersClient({ initialRows }: { initialRows: ProfileRow[] }) {
  const [rows, setRows] = useState<ProfileRow[]>(initialRows);
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
        const next = await fetchProfilesPage(nextPage);
        setRows((prev) => [...prev, ...next]);
        setPage(nextPage);
        if (next.length < PAGE_SIZE) setHasMore(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load more users");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full table-fixed text-left text-sm">
            <colgroup>
              <col style={{ width: "180px" }} />
              <col style={{ width: "280px" }} />
              <col style={{ width: "210px" }} />
              <col style={{ width: "180px" }} />
              <col style={{ width: "420px" }} />
            </colgroup>
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Flags</th>
                <th className="px-4 py-3">Profile ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
              {rows.map((u) => {
                const name = [u.first_name, u.last_name].filter(Boolean).join(" ");
                return (
                  <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      <div className="truncate">{name || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      <div className="truncate">{u.email ?? "(no email)"}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatUtc(u.created_datetime_utc)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {u.is_superadmin ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200">
                            superadmin
                          </span>
                        ) : null}
                        {u.is_in_study ? (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200">
                            in study
                          </span>
                        ) : null}
                        {u.is_matrix_admin ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                            matrix admin
                          </span>
                        ) : null}
                        {!u.is_superadmin && !u.is_in_study && !u.is_matrix_admin ? (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">—</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      <div className="truncate">{u.id}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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

