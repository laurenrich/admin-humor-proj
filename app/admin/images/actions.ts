"use server";

import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type ImageRow = {
  id: string;
  created_datetime_utc: string;
  url: string | null;
  is_public: boolean | null;
  is_common_use: boolean | null;
  additional_context: string | null;
  image_description: string | null;
  celebrity_recognition: string | null;
};

const PAGE_SIZE = 100;

function toBool(v: FormDataEntryValue | null) {
  if (v === null) return false;
  if (typeof v === "string") return v === "on" || v === "true" || v === "1";
  return false;
}

export async function createImage(formData: FormData) {
  const res = await requireSuperadmin();
  if (!res.ok) throw new Error("Not authorized");

  const url = String(formData.get("url") ?? "").trim();
  const additional_context = String(formData.get("additional_context") ?? "").trim();
  const image_description = String(formData.get("image_description") ?? "").trim();
  const celebrity_recognition = String(
    formData.get("celebrity_recognition") ?? ""
  ).trim();
  const is_public = toBool(formData.get("is_public"));
  const is_common_use = toBool(formData.get("is_common_use"));

  if (!url) throw new Error("Missing url");

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("images").insert({
    url,
    additional_context: additional_context || null,
    image_description: image_description || null,
    celebrity_recognition: celebrity_recognition || null,
    is_public,
    is_common_use,
    profile_id: res.profile.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/images");
}

export async function updateImage(formData: FormData) {
  const res = await requireSuperadmin();
  if (!res.ok) throw new Error("Not authorized");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing id");

  const patch: Record<string, unknown> = {};

  if (formData.has("url")) patch.url = String(formData.get("url") ?? "").trim();
  if (formData.has("additional_context"))
    patch.additional_context = String(formData.get("additional_context") ?? "").trim() || null;
  if (formData.has("image_description"))
    patch.image_description = String(formData.get("image_description") ?? "").trim() || null;
  if (formData.has("celebrity_recognition"))
    patch.celebrity_recognition =
      String(formData.get("celebrity_recognition") ?? "").trim() || null;
  if (formData.has("is_public")) patch.is_public = toBool(formData.get("is_public"));
  if (formData.has("is_common_use"))
    patch.is_common_use = toBool(formData.get("is_common_use"));

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("images").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/images");
}

export async function deleteImage(formData: FormData) {
  const res = await requireSuperadmin();
  if (!res.ok) throw new Error("Not authorized");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing id");

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("images").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/images");
}

export async function fetchImagesPage(page: number): Promise<ImageRow[]> {
  const res = await requireSuperadmin();
  if (!res.ok) throw new Error("Not authorized");

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 0;
  const from = safePage * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("images")
    .select(
      "id,created_datetime_utc,url,is_public,is_common_use,additional_context,image_description,celebrity_recognition"
    )
    .order("created_datetime_utc", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return (data ?? []) as ImageRow[];
}

