const FLAVOR_BAR =
  "from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500";

export function FlavorBarChart({
  rows,
  emptyHint,
}: {
  rows: { label: string; count: number }[];
  emptyHint?: string;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  const nf = new Intl.NumberFormat("en-US");

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
      <div className="mb-4">
        <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Top humor flavors
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Captions by flavor (recent sample, up to 12k rows / 6 months)
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyHint ?? "No data in range."}</p>
      ) : (
        <ul className="flex flex-1 flex-col gap-3">
          {rows.map((r) => {
            const pct = Math.round((r.count / max) * 100);
            return (
              <li key={r.label} className="min-w-0">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-zinc-700 dark:text-zinc-200">{r.label}</span>
                  <span className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">
                    {nf.format(r.count)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full bg-linear-to-r ${FLAVOR_BAR}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type LeaderRow = {
  id: string;
  content: string | null;
  like_count: number | null;
  created_datetime_utc: string;
};

export function TopCaptionsList({ rows }: { rows: LeaderRow[] }) {
  const maxLikes = Math.max(...rows.map((r) => Number(r.like_count ?? 0)), 1);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
      <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Most liked captions
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Top five by like count</p>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">No captions yet.</p>
      ) : (
        <ol className="mt-4 flex flex-1 flex-col gap-4">
          {rows.map((c, idx) => {
            const content = (c.content ?? "").replace(/\s+/g, " ").trim();
            const preview =
              content.length > 140 ? `${content.slice(0, 140)}…` : content || "(empty)";
            const likes = Number(c.like_count ?? 0);
            const barPct = Math.round((likes / maxLikes) * 100);
            return (
              <li key={c.id} className="flex gap-3">
                <div
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums",
                    idx === 0
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100"
                      : idx === 1
                        ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100"
                        : idx === 2
                          ? "bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
                  ].join(" ")}
                >
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-zinc-900 dark:text-zinc-50">{preview}</p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-sky-500 to-indigo-500 dark:from-sky-400 dark:to-indigo-400"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
                    {likes.toLocaleString()} likes
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
