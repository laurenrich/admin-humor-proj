import { requireSuperadminOrRedirect } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import ExpandableCell from "./ExpandableCell";

const PAGE_SIZE = 1000;

function isIsoLike(v: unknown) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v);
}

function formatUtc(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

function formatCell(v: unknown) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return new Intl.NumberFormat("en-US").format(v);
  if (typeof v === "string") return isIsoLike(v) ? formatUtc(v) : v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

async function fetchFirstPageFromAnyTable(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const candidates = [
    "llm_model_responses",
    "llm_responses",
    "llm_response",
    "llmResponses",
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

export default async function AdminLlmResponsesPage() {
  await requireSuperadminOrRedirect();
  const admin = createSupabaseAdminClient();

  const { table, rows, errors } = await fetchFirstPageFromAnyTable(admin);

  if (!table) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">LLM responses</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Read-only view. Could not find a matching table.
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
    "prompt_chain_id",
    "llm_model_id",
    "request_id",
    "response_text",
    "raw_response",
    "usage_tokens",
    "model",
    "finish_reason",
  ];

  const longPromptColumns = new Set([
    "llm_model_response",
    "llm_system_prompt",
    "llm_user_prompt",
  ]);

  const keys = rows.length ? Object.keys(rows[0] ?? {}) : [];
  const columns = [
    ...preferred.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !preferred.includes(k)).sort(),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">LLM responses</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Read-only view of <span className="font-mono">{table}</span>. Showing up to {PAGE_SIZE}.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full table-auto text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="px-4 py-3 whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
              {rows.map((r, idx) => (
                <tr
                  key={String((r["id"] as string | number | undefined) ?? idx)}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                >
                  {columns.map((c) => {
                    const raw = r[c];
                    const text = formatCell(raw);
                    const isIdCol = c === "id" || c.endsWith("_id");
                    const isLongPrompt = longPromptColumns.has(c);
                    const isLong = typeof text === "string" && text.length > 180;
                    return (
                      <td key={c} className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        {isLongPrompt ? (
                          <ExpandableCell text={text} />
                        ) : (
                          <div
                            className={[
                              isIdCol ? "font-mono text-xs break-all whitespace-normal" : "",
                              "whitespace-nowrap",
                            ].join(" ")}
                          >
                            <div
                              className={
                                isIdCol ? "" : isLong ? "max-w-[480px] truncate" : ""
                              }
                              title={!isIdCol && isLong ? text : undefined}
                            >
                              {text}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(columns.length, 1)}
                    className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    No rows found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
