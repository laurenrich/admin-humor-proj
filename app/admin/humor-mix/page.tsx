import { requireSuperadminOrRedirect } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updateHumorMixRow } from "./actions";
import CrudClient from "@/app/admin/_components/CrudClient";

const PAGE_SIZE = 500;

async function fetchFromAnyTable(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const candidates = [
    "humor_flavor_mix",
    "humor_flavor_mixes",
    "humor_mix",
    "humor_mixes",
    "humor_mix_config",
    "humor_mix_configs",
  ];
  const errors: { table: string; message: string }[] = [];

  for (const table of candidates) {
    const res = await admin
      .from(table)
      .select("*")
      .order("id", { ascending: true })
      .range(0, PAGE_SIZE - 1);
    if (!res.error) return { table, rows: (res.data ?? []) as Record<string, unknown>[], errors };
    errors.push({ table, message: res.error.message });
  }

  return { table: null as string | null, rows: [] as Record<string, unknown>[], errors };
}

export default async function AdminHumorMixPage() {
  await requireSuperadminOrRedirect();
  const admin = createSupabaseAdminClient();

  const { table, rows, errors } = await fetchFromAnyTable(admin);

  if (!table) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Humor mix</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Read/update view. Could not find a matching table.
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          <div className="font-medium">Tried tables:</div>
          <ul className="mt-2 list-disc pl-5">
            {errors.map((e) => (
              <li key={e.table}>
                <span className="font-mono">{e.table}</span>: {e.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const preferred = ["id", "created_datetime_utc", "humor_flavor_id", "caption_count"];

  return (
    <CrudClient
      title="Humor mix"
      pagePath="/admin/humor-mix"
      table={table}
      rows={rows}
      preferredColumns={preferred}
      hideCreate
      hideDelete
      updateAction={updateHumorMixRow}
    />
  );
}

