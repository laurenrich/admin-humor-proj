import { requireSuperadminOrRedirect } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createLlmProvider, deleteLlmProvider, updateLlmProvider } from "./actions";
import CrudClient from "@/app/admin/_components/CrudClient";

const PAGE_SIZE = 200;

async function fetchFromAnyTable(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const candidates = ["llm_providers", "llm_provider", "llmProviders"];
  const errors: { table: string; message: string }[] = [];

  for (const table of candidates) {
    const res = await admin.from(table).select("*").range(0, PAGE_SIZE - 1);
    if (!res.error) return { table, rows: (res.data ?? []) as Record<string, unknown>[], errors };
    errors.push({ table, message: res.error.message });
  }

  return { table: null as string | null, rows: [] as Record<string, unknown>[], errors };
}

export default async function AdminLlmProvidersPage() {
  await requireSuperadminOrRedirect();
  const admin = createSupabaseAdminClient();

  const { table, rows, errors } = await fetchFromAnyTable(admin);

  if (!table) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">LLM providers</h1>
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

  const preferred = [
    "id",
    "created_datetime_utc",
    "created_at",
    "name",
    "slug",
    "api_base_url",
    "is_active",
    "is_enabled",
    "notes",
  ];

  return (
    <CrudClient
      title="LLM providers"
      pagePath="/admin/llm-providers"
      table={table}
      rows={rows}
      preferredColumns={preferred}
      createAction={createLlmProvider}
      updateAction={updateLlmProvider}
      deleteAction={deleteLlmProvider}
    />
  );
}
