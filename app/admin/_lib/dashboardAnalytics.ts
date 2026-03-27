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

async function resolveFlavorLabels(
  admin: AdminClient,
  sorted: { id: string; count: number }[]
): Promise<{ label: string; count: number }[]> {
  if (sorted.length === 0) return [];
  const ids = sorted.map((s) => s.id);
  const nameById = new Map<string, string>();

  for (const table of ["humor_flavors", "humor_flavor"] as const) {
    const { data, error } = await admin.from(table).select("id,name,title,slug").in("id", ids);
    if (error) continue;
    for (const row of data ?? []) {
      const r = row as Record<string, unknown>;
      const id = String(r.id ?? "");
      const label =
        (typeof r.name === "string" && r.name) ||
        (typeof r.title === "string" && r.title) ||
        (typeof r.slug === "string" && r.slug) ||
        id.slice(0, 8);
      nameById.set(id, label);
    }
    if (nameById.size > 0) break;
  }

  return sorted.map(({ id, count }) => {
    const sid = String(id);
    const short = sid.length > 8 ? `${sid.slice(0, 8)}…` : sid;
    return {
      label: nameById.get(sid) ?? `Flavor ${short}`,
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
