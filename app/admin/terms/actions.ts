"use server";

import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { err, ok, toErrorMessage, friendlyDbError, type ActionResult } from "@/lib/admin/actionResult";
import { revalidatePath } from "next/cache";

const ALLOWED_TABLES = new Set([
  "terms",
  "term",
  "glossary_terms",
  "glossary_term",
]);

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

function assertAllowedTable(table: string) {
  if (!ALLOWED_TABLES.has(table)) throw new Error("Invalid table");
}

const DISALLOWED_KEYS = new Set([
  "id",
  "created_at",
  "created_datetime_utc",
  "modified_at",
  "modified_datetime_utc",
  "updated_at",
  "updated_datetime_utc",
]);

export async function createTerm(formData: FormData): Promise<ActionResult> {
  try {
    const res = await requireSuperadmin();
    if (!res.ok) return err("Not authorized");

    const table = String(formData.get("table") ?? "").trim();
    assertAllowedTable(table);

    const json = String(formData.get("json") ?? "").trim();
    if (json) {
      let payload: unknown;
      try {
        payload = JSON.parse(json);
      } catch {
        return err("Invalid JSON");
      }

      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return err("JSON payload must be an object");
      }

      // Keep system columns trustworthy even in JSON mode.
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
        if (DISALLOWED_KEYS.has(k)) continue;
        cleaned[k] = v;
      }

      const admin = createSupabaseAdminClient();
      const { error } = await admin.from(table).insert(cleaned);
      if (error) return err(friendlyDbError(error.message));
      revalidatePath("/admin/terms");
      return ok();
    }

    // Otherwise treat any provided fields as the payload.
    const payload: Record<string, unknown> = {};
    for (const [k, v] of formData.entries()) {
      if (k === "table" || k === "json") continue;
      if (DISALLOWED_KEYS.has(k)) continue;
      if (typeof v !== "string") continue;

      const parsed = parseScalar(v);
      if (parsed !== null) payload[k] = parsed;
    }

    if (Object.keys(payload).length === 0) {
      return err("Provide at least one field");
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from(table).insert(payload);
    if (error) return err(friendlyDbError(error.message));

    revalidatePath("/admin/terms");
    return ok();
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateTerm(formData: FormData): Promise<ActionResult> {
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
      if (DISALLOWED_KEYS.has(k)) continue;

      if (typeof v === "string") patch[k] = parseScalar(v);
    }

    if (Object.keys(patch).length === 0) return ok();

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from(table).update(patch).eq("id", id);
    if (error) return err(friendlyDbError(error.message));

    revalidatePath("/admin/terms");
    return ok();
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function deleteTerm(formData: FormData): Promise<ActionResult> {
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

    revalidatePath("/admin/terms");
    return ok();
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

