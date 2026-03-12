import { requireSuperadminOrRedirect } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createTerm, deleteTerm, updateTerm } from "./actions";
import CrudClient from "@/app/admin/_components/CrudClient";

const PAGE_SIZE = 200;

async function fetchFromAnyTable(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const candidates = ["terms", "term", "glossary_terms", "glossary_term"];
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

export default async function AdminTermsPage() {
  await requireSuperadminOrRedirect();
  const admin = createSupabaseAdminClient();

  const { table, rows, errors } = await fetchFromAnyTable(admin);

  if (!table) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Terms</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Create/read/update/delete. Could not find a matching table.
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

  const preferred = ["id", "term", "name", "title", "slug", "definition", "description"];
  return (
    <CrudClient
      title="Terms"
      pagePath="/admin/terms"
      table={table}
      rows={rows}
      preferredColumns={preferred}
      requiredFields={[]}
      createAction={createTerm}
      updateAction={updateTerm}
      deleteAction={deleteTerm}
    />
  );
}

