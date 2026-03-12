import { requireSuperadminOrRedirect } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createCaptionExample, deleteCaptionExample, updateCaptionExample } from "./actions";
import CrudClient from "@/app/admin/_components/CrudClient";

const PAGE_SIZE = 200;

async function fetchFromAnyTable(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const candidates = ["caption_examples", "caption_example", "captionExamples"];
  const errors: { table: string; message: string }[] = [];

  for (const table of candidates) {
    const res = await admin
      .from(table)
      .select("*")
      .order("created_datetime_utc", { ascending: false })
      .range(0, PAGE_SIZE - 1);
    if (!res.error) return { table, rows: (res.data ?? []) as Record<string, unknown>[], errors };
    errors.push({ table, message: res.error.message });
  }

  for (const table of candidates) {
    const res = await admin
      .from(table)
      .select("*")
      .order("id", { ascending: true })
      .range(0, PAGE_SIZE - 1);
    if (!res.error) return { table, rows: (res.data ?? []) as Record<string, unknown>[], errors };
  }

  return { table: null as string | null, rows: [] as Record<string, unknown>[], errors };
}

export default async function AdminCaptionExamplesPage() {
  await requireSuperadminOrRedirect();
  const admin = createSupabaseAdminClient();

  const { table, rows, errors } = await fetchFromAnyTable(admin);

  if (!table) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Caption examples</h1>
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

  const dbOrder = [
    "id",
    "created_datetime_utc",
    "modified_datetime_utc",
    "image_description",
    "caption",
    "explanation",
    "priority",
    "image_id",
  ];

  return (
    <CrudClient
      title="Caption examples"
      pagePath="/admin/caption-examples"
      table={table}
      rows={rows}
      preferredColumns={dbOrder}
      createOrder={["image_description", "caption", "explanation", "priority", "image_id"]}
      requiredFields={["image_description", "caption", "explanation"]}
      createAction={createCaptionExample}
      updateAction={updateCaptionExample}
      deleteAction={deleteCaptionExample}
    />
  );
}

