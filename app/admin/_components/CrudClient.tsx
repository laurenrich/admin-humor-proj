"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/admin/actionResult";

type Row = Record<string, unknown>;

function defaultIsAutoManagedColumn(col: string) {
  if (col === "id") return true;
  if (/_at$/.test(col)) return true;
  if (/_(datetime|timestamp)_utc$/.test(col)) return true;
  if (/^(created|updated|modified)_/.test(col)) return true;
  if (/_(created|updated|modified)_/.test(col)) return true;
  return false;
}

function isIsoLike(v: unknown) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v);
}

function formatUtc(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

function formatPreview(v: unknown) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return isIsoLike(v) ? formatUtc(v) : v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function FieldInput({
  name,
  required,
  placeholder,
  defaultValue,
  textarea,
  inputMode,
  pattern,
  formId,
}: {
  name: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  textarea?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
  formId?: string;
}) {
  const common =
    "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50";
  if (textarea) {
    return (
      <textarea
        name={name}
        required={required}
        defaultValue={defaultValue}
        rows={3}
        className={common}
        form={formId}
        placeholder={placeholder}
      />
    );
  }
  return (
    <input
      name={name}
      required={required}
      defaultValue={defaultValue}
      className={"h-10 " + common}
      form={formId}
      placeholder={placeholder}
      inputMode={inputMode}
      pattern={pattern}
    />
  );
}

export default function CrudClient(props: {
  title: string;
  pagePath: string;
  table: string;
  rows: Row[];
  preferredColumns?: string[];
  createOrder?: string[];
  requiredFields?: string[];
  hideCreate?: boolean;
  hideDelete?: boolean;
  isAutoManagedColumn?: (col: string) => boolean;
  createAction?: (formData: FormData) => Promise<ActionResult>;
  updateAction: (formData: FormData) => Promise<ActionResult>;
  deleteAction?: (formData: FormData) => Promise<ActionResult>;
}) {
  const {
    title,
    pagePath,
    table,
    rows,
    preferredColumns = [],
    createOrder,
    requiredFields = [],
    hideCreate,
    hideDelete,
    isAutoManagedColumn = defaultIsAutoManagedColumn,
    createAction,
    updateAction,
    deleteAction,
  } = props;

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [topError, setTopError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string | null>>({});

  const keys = useMemo(() => {
    if (rows.length) return Object.keys(rows[0] ?? {});
    return preferredColumns;
  }, [rows, preferredColumns]);

  const columns = useMemo(() => {
    const colSet = new Set(keys);
    const ordered = preferredColumns.filter((c) => colSet.has(c));
    const rest = [...keys].filter((c) => !preferredColumns.includes(c)).sort();
    return [...ordered, ...rest];
  }, [keys, preferredColumns]);

  const createCols = useMemo(() => {
    const base = createOrder?.length ? createOrder : columns;
    return base.filter((c) => !isAutoManagedColumn(c) && c !== "id");
  }, [columns, createOrder, isAutoManagedColumn]);

  function textareaFor(col: string) {
    return /(description|explanation|content|prompt|instruction|notes|context)/i.test(col);
  }

  async function runAction(
    action: (fd: FormData) => Promise<ActionResult>,
    fd: FormData,
    opts?: { rowId?: string }
  ) {
    setTopError(null);
    if (opts?.rowId) setRowError((prev) => ({ ...prev, [opts.rowId!]: null }));

    startTransition(async () => {
      const res = await action(fd);
      if (!res.ok) {
        if (opts?.rowId) setRowError((prev) => ({ ...prev, [opts.rowId!]: res.error }));
        else setTopError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function onCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!createAction) return;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const fd = new FormData(form);
    fd.set("table", table);
    runAction(createAction, fd);
  }

  function onRowUpdateSubmit(rowId: string) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const fd = new FormData(form);
      fd.set("table", table);
      fd.set("id", rowId);
      runAction(updateAction, fd, { rowId });
    };
  }

  function onDelete(rowId: string) {
    if (!deleteAction) return;
    const fd = new FormData();
    fd.set("table", table);
    fd.set("id", rowId);
    runAction(deleteAction, fd, { rowId });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Table: <span className="font-mono">`{table}`</span>
        </p>
      </div>

      {topError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {topError}
        </div>
      ) : null}

      {!hideCreate && createAction ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-base font-semibold">Create</h2>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              IDs/timestamps auto-managed
            </div>
          </div>

          <form onSubmit={onCreateSubmit} className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
            {createCols.slice(0, 10).map((c) => (
              <label
                key={c}
                className={[
                  "flex flex-col gap-1",
                  textareaFor(c) ? "md:col-span-2" : "",
                ].join(" ")}
              >
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{c}</span>
                <FieldInput
                  name={c}
                  textarea={textareaFor(c)}
                  required={requiredFields.includes(c)}
                  inputMode={c === "priority" ? "numeric" : undefined}
                  placeholder={
                    c.endsWith("_id")
                      ? requiredFields.includes(c)
                        ? "required"
                        : "(optional)"
                      : undefined
                  }
                />
              </label>
            ))}

            <div className="md:col-span-2 flex items-center justify-end">
              <button
                disabled={isPending}
                className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
              >
                {isPending ? "Working…" : "Create"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full table-auto text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span>{c}</span>
                      {isAutoManagedColumn(c) ? (
                        <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                          auto
                        </span>
                      ) : null}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
              {rows.map((r, idx) => {
                const id = String((r["id"] as string | number | undefined) ?? "");
                const rowKey = id || String(idx);
                const errMsg = rowError[rowKey] ?? null;

                return (
                  <tr key={rowKey} className="align-top">
                    {columns.map((c) => {
                      const raw = r[c];
                      const preview = formatPreview(raw);
                      const isLong = preview.length > 240 || preview.includes("\n");
                      const isIdCol = c === "id" || c.endsWith("_id");
                      const editable = !isAutoManagedColumn(c);
                      const system = isAutoManagedColumn(c);
                      const formId = `crud-update-${pagePath}-${rowKey}`;
                      return (
                        <td
                          key={c}
                          className={[
                            "px-4 py-3",
                            system
                              ? "text-zinc-500 dark:text-zinc-400"
                              : "text-zinc-700 dark:text-zinc-300",
                          ].join(" ")}
                        >
                          <div
                            className={[
                              isIdCol
                                ? "font-mono text-xs break-all whitespace-normal"
                                : "whitespace-nowrap",
                            ].join(" ")}
                          >
                            {editable ? (
                              <FieldInput
                                name={c}
                                formId={formId}
                                defaultValue={preview}
                                required={requiredFields.includes(c)}
                                textarea={false}
                                placeholder={raw === null || raw === undefined ? "(null)" : undefined}
                                inputMode={c === "priority" ? "numeric" : undefined}
                              />
                            ) : (
                              <div
                                className={!isIdCol && isLong ? "max-w-[520px] truncate" : ""}
                                title={!isIdCol && isLong ? preview : undefined}
                              >
                                {preview || "—"}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    <td className="px-4 py-3">
                      {!id ? (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">No id</span>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <form id={`crud-update-${pagePath}-${rowKey}`} onSubmit={onRowUpdateSubmit(rowKey)}>
                            <button
                              disabled={isPending}
                              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                            >
                              {isPending ? "Working…" : "Save"}
                            </button>
                          </form>

                          {!hideDelete && deleteAction ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => onDelete(rowKey)}
                              className="h-9 rounded-xl bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
                            >
                              Delete
                            </button>
                          ) : null}

                          {errMsg ? (
                            <div className="max-w-[240px] text-xs text-red-700 dark:text-red-200">
                              {errMsg}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(columns.length + 1, 1)}
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

