"use server";

import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { err, ok, toErrorMessage, friendlyDbError, type ActionResult } from "@/lib/admin/actionResult";
import { revalidatePath } from "next/cache";

const ALLOWED_TABLES = new Set(["llm_models", "llm_model", "llmModels"]);

function assertAllowedTable(table: string) {
  if (!ALLOWED_TABLES.has(table)) throw new Error("Invalid table");
}

function isAutoManagedColumn(col: string) {
  if (col === "id") return true;
  if (/_at$/.test(col)) return true;
  if (/_(datetime|timestamp)_utc$/.test(col)) return true;
  if (/^(created|updated|modified)_/.test(col)) return true;
  if (/_(created|updated|modified)_/.test(col)) return true;
  return false;
}

function parseScalar(raw: string) {
  const v = raw.trim();
  if (v === "") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if ((v.startsWith("{") && v.endsWith("}")) || (v.startsWith("[") && v.endsWith("]"))) {
    try {
      return JSON.parse(v);
    } catch {
      return raw;
    }
  }
  return raw;
}

function isValidSmallint(v: unknown): v is number {
  if (typeof v !== "number" || !Number.isFinite(v)) return false;
  const n = Math.floor(v);
  return n >= -32768 && n <= 32767 && n === v;
}

export async function createLlmModel(formData: FormData): Promise<ActionResult> {
  try {
    const res = await requireSuperadmin();
    if (!res.ok) return err("Not authorized");

    const table = String(formData.get("table") ?? "").trim();
    assertAllowedTable(table);

    const payload: Record<string, unknown> = {};
    for (const [k, v] of formData.entries()) {
      if (k === "table") continue;
      if (isAutoManagedColumn(k)) continue;
      if (typeof v !== "string") continue;
      const parsed = parseScalar(v);
      if (parsed !== null) payload[k] = parsed;
    }

    if (Object.keys(payload).length === 0) return err("Provide at least one field");
    if (!payload.llm_provider_id) return err("llm_provider_id is required");
    if (!isValidSmallint(payload.llm_provider_id)) {
      return err("Invalid type for smallint: llm_provider_id (must be integer -32768 to 32767)");
    }
    if (!payload.name) return err("name is required");
    if (!payload.provider_model_id) return err("provider_model_id is required");

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from(table).insert(payload);
    if (error) return err(friendlyDbError(error.message));
    revalidatePath("/admin/llm-models");
    return ok();
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateLlmModel(formData: FormData): Promise<ActionResult> {
  try {
    const res = await requireSuperadmin();
    if (!res.ok) return err("Not authorized");

    const table = String(formData.get("table") ?? "").trim();
    assertAllowedTable(table);

    const id = String(formData.get("id") ?? "").trim();
    if (!id) return err("Missing id");

    const patch: Record<string, unknown> = {};
    for (const [k, v] of formData.entries()) {
      if (k === "table" || k === "id") continue;
      if (isAutoManagedColumn(k)) continue;
      if (typeof v !== "string") continue;
      patch[k] = parseScalar(v);
    }

    if (Object.keys(patch).length === 0) return ok();

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from(table).update(patch).eq("id", id);
    if (error) return err(friendlyDbError(error.message));
    revalidatePath("/admin/llm-models");
    return ok();
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function deleteLlmModel(formData: FormData): Promise<ActionResult> {
  try {
    const res = await requireSuperadmin();
    if (!res.ok) return err("Not authorized");

    const table = String(formData.get("table") ?? "").trim();
    assertAllowedTable(table);

    const id = String(formData.get("id") ?? "").trim();
    if (!id) return err("Missing id");

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from(table).delete().eq("id", id);
    if (error) return err(friendlyDbError(error.message));
    revalidatePath("/admin/llm-models");
    return ok();
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

