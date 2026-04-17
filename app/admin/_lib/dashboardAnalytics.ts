import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

const MAX_ROWS = 12_000;

async function paginateCaptions(
  admin: AdminClient,
  sinceIso: string,
  select: string
): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  let from = 0;
  const pageSize = 1000;
  while (out.length < MAX_ROWS) {
    const { data, error } = await admin
      .from("captions")
      .select(select)
      .gte("created_datetime_utc", sinceIso)
      .order("created_datetime_utc", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    out.push(...(data as unknown as Record<string, unknown>[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

function rowFlavorLabel(row: Record<string, unknown>): string {
  const id = String(row.id ?? "");
  return (
    (typeof row.name === "string" && row.name.trim()) ||
    (typeof row.title === "string" && row.title.trim()) ||
    (typeof row.slug === "string" && row.slug.trim()) ||
    (id.length > 8 ? `${id.slice(0, 8)}…` : id || "Unknown")
  );
}

/** Map caption `humor_flavor_id` values → display label (handles id vs sort_order / order mismatches). */
async function fetchFlavorLabelMap(admin: AdminClient): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const numericKeyFields = [
    "sort_order",
    "order",
    "display_order",
    "flavor_index",
    "step_order",
  ] as const;

  for (const table of ["humor_flavors", "humor_flavor"] as const) {
    let from = 0;
    const pageSize = 1000;
    let foundTable = false;

    while (from < 25_000) {
      const { data, error } = await admin
        .from(table)
        .select("*")
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) break;
      if (!data?.length) {
        if (from === 0) break;
        foundTable = true;
        break;
      }
      foundTable = true;

      for (const row of data) {
        const r = row as Record<string, unknown>;
        const label = rowFlavorLabel(r);
        const idVal = r.id;
        if (idVal !== null && idVal !== undefined && String(idVal) !== "") {
          map.set(String(idVal), label);
        }
        for (const field of numericKeyFields) {
          const v = r[field];
          const n =
            typeof v === "number" && Number.isFinite(v)
              ? v
              : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))
                ? Number(v)
                : NaN;
          if (Number.isFinite(n)) map.set(String(Math.trunc(n)), label);
        }
      }

      if (data.length < pageSize) break;
      from += pageSize;
    }

    if (foundTable) break;
  }

  return map;
}

async function resolveFlavorLabels(
  admin: AdminClient,
  sorted: { id: string; count: number }[]
): Promise<{ label: string; count: number }[]> {
  if (sorted.length === 0) return [];
  const nameByKey = await fetchFlavorLabelMap(admin);

  return sorted.map(({ id, count }) => {
    const sid = String(id).trim();
    const short = sid.length > 8 ? `${sid.slice(0, 8)}…` : sid;
    return {
      label: nameByKey.get(sid) ?? `Flavor ${short}`,
      count,
    };
  });
}

/** Paginated captions → top flavors only (6‑month window) */
export async function fetchCaptionAnalyticsBundle(admin: AdminClient) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 6);
  const sinceIso = sixMonthsAgo.toISOString();

  const rows = await paginateCaptions(admin, sinceIso, "humor_flavor_id");

  const flavorCounts = new Map<string, number>();

  for (const row of rows) {
    const fid = row.humor_flavor_id as string | number | null | undefined;
    if (fid !== null && fid !== undefined && fid !== "") {
      const key = String(fid);
      flavorCounts.set(key, (flavorCounts.get(key) ?? 0) + 1);
    }
  }

  const sortedFlavors = [...flavorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, count]) => ({ id: String(id), count }));

  const topFlavors = await resolveFlavorLabels(admin, sortedFlavors);

  return { topFlavors };
}
