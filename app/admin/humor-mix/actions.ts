"use server";

import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { err, ok, toErrorMessage, friendlyDbError, type ActionResult } from "@/lib/admin/actionResult";
import { revalidatePath } from "next/cache";
import { updateAuditFields } from "@/lib/db/auditFields";

const ALLOWED_TABLES = new Set([
  "humor_flavor_mix",
  "humor_flavor_mixes",
  "humor_mix",
  "humor_mixes",
  "humor_mix_config",
  "humor_mix_configs",
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

export async function updateHumorMixRow(formData: FormData): Promise<ActionResult> {
  try {
    const res = await requireSuperadmin();
    if (!res.ok) return err("Not authorized");

    const table = String(formData.get("table") ?? "").trim();
    if (!ALLOWED_TABLES.has(table)) return err("Invalid table");

    const id = String(formData.get("id") ?? "").trim();
    if (!id) return err("Missing id");

    const patch: Record<string, unknown> = {};
    for (const [k, v] of formData.entries()) {
      if (k === "table" || k === "id") continue;
      if (k === "created_at" || k === "created_datetime_utc") continue;
      if (k === "updated_at" || k === "updated_datetime_utc") continue;
      if (k === "modified_datetime_utc") continue;
      if (k === "created_by_user_id" || k === "modified_by_user_id") continue;

      if (typeof v === "string") {
        const parsed = parseScalar(v);
        if (parsed !== null) patch[k] = parsed;
      }
    }

    if (Object.keys(patch).length === 0) return ok();

    Object.assign(patch, updateAuditFields(res.profile.id));

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from(table).update(patch).eq("id", id);
    if (error) return err(friendlyDbError(error.message));

    revalidatePath("/admin/humor-mix");
    return ok();
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

