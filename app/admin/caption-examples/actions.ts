"use server";

import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { err, ok, toErrorMessage, friendlyDbError, type ActionResult } from "@/lib/admin/actionResult";
import { revalidatePath } from "next/cache";
import { insertAuditFields, updateAuditFields } from "@/lib/db/auditFields";

const ALLOWED_TABLES = new Set([
  "caption_examples",
  "caption_example",
  "captionExamples",
]);

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

function isUuid(v: unknown) {
  if (typeof v !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function requiredString(name: string, v: unknown) {
  if (typeof v !== "string" || v.trim() === "") {
    throw new Error(`Missing ${name}`);
  }
}

export async function createCaptionExample(formData: FormData): Promise<ActionResult> {
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

    // Match known schema requirements (caption_examples table).
    requiredString("image_description", payload.image_description);
    requiredString("caption", payload.caption);
    requiredString("explanation", payload.explanation);

    if ("priority" in payload) {
      const n = Number(payload.priority);
      if (!Number.isFinite(n)) return err("priority must be a number");
    }

    if ("image_id" in payload) {
      if (payload.image_id !== null && !isUuid(payload.image_id)) {
        return err("image_id must be a UUID");
      }
    }

    Object.assign(payload, insertAuditFields(res.profile.id));

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from(table).insert(payload);
    if (error) return err(friendlyDbError(error.message));
    revalidatePath("/admin/caption-examples");
    return ok();
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateCaptionExample(formData: FormData): Promise<ActionResult> {
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

    // Don't allow clearing required columns.
    if ("image_description" in patch)
      requiredString("image_description", patch.image_description);
    if ("caption" in patch) requiredString("caption", patch.caption);
    if ("explanation" in patch) requiredString("explanation", patch.explanation);

    if ("priority" in patch) {
      const n = Number(patch.priority);
      if (!Number.isFinite(n)) return err("priority must be a number");
    }

    if ("image_id" in patch) {
      if (patch.image_id !== null && !isUuid(patch.image_id)) {
        return err("image_id must be a UUID");
      }
    }

    Object.assign(patch, updateAuditFields(res.profile.id));

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from(table).update(patch).eq("id", id);
    if (error) return err(friendlyDbError(error.message));
    revalidatePath("/admin/caption-examples");
    return ok();
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function deleteCaptionExample(formData: FormData): Promise<ActionResult> {
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
    revalidatePath("/admin/caption-examples");
    return ok();
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

