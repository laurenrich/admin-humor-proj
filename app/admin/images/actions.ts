"use server";

import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { err, ok, toErrorMessage, friendlyDbError, type ActionResult } from "@/lib/admin/actionResult";
import { revalidatePath } from "next/cache";
import { insertAuditFields, updateAuditFields } from "@/lib/db/auditFields";

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

function guessExtension(file: File) {
  const byMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/svg+xml": "svg",
  };

  const fromMime = byMime[file.type];
  if (fromMime) return fromMime;

  const name = (file.name ?? "").toLowerCase();
  const m = name.match(/\.([a-z0-9]{2,8})$/);
  return m?.[1] ?? "bin";
}

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
  "heic",
  "heif",
  "svg",
]);

function contentTypeForExtension(ext: string) {
  const byExt: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    avif: "image/avif",
    heic: "image/heic",
    heif: "image/heif",
    svg: "image/svg+xml",
  };
  return byExt[ext] ?? "application/octet-stream";
}

async function uploadToStorageAndGetPublicUrl(args: {
  bucket: string;
  ownerProfileId: string;
  file: File;
}) {
  const { bucket, ownerProfileId, file } = args;

  // Basic guardrails (kept permissive; admins may upload large images).
  if (!file || typeof file.size !== "number" || file.size <= 0) {
    throw new Error("Missing image file");
  }

  const ext = guessExtension(file);
  const normalizedExt = ext.toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(normalizedExt)) {
    throw new Error("Only image files are allowed (jpg, png, webp, gif, avif, heic/heif, svg)");
  }
  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  const objectPath = `admin/${ownerProfileId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const admin = createSupabaseAdminClient();
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage.from(bucket).upload(objectPath, bytes, {
    contentType: file.type || contentTypeForExtension(normalizedExt),
    upsert: false,
  });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = admin.storage.from(bucket).getPublicUrl(objectPath);
  const publicUrl = data?.publicUrl;
  if (!publicUrl) throw new Error("Upload succeeded but public URL was not returned");
  return publicUrl;
}

export async function createImage(formData: FormData): Promise<ActionResult> {
  try {
    const res = await requireSuperadmin();
    if (!res.ok) return err("Not authorized");

    const url = String(formData.get("url") ?? "").trim();
    const file = formData.get("file");
    const additional_context = String(formData.get("additional_context") ?? "").trim();
    const image_description = String(formData.get("image_description") ?? "").trim();
    const celebrity_recognition = String(formData.get("celebrity_recognition") ?? "").trim();
    const is_public = toBool(formData.get("is_public"));
    const is_common_use = toBool(formData.get("is_common_use"));

    const bucket = process.env.SUPABASE_IMAGES_BUCKET ?? "images";

    let finalUrl = url;

    // If a file is provided, treat that as the source of truth.
    if (file instanceof File && file.size > 0) {
      finalUrl = await uploadToStorageAndGetPublicUrl({
        bucket,
        ownerProfileId: res.profile.id,
        file,
      });
    }

    if (!finalUrl) return err("Provide a URL or upload a file");

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("images").insert({
      url: finalUrl,
      additional_context: additional_context || null,
      image_description: image_description || null,
      celebrity_recognition: celebrity_recognition || null,
      is_public,
      is_common_use,
      profile_id: res.profile.id,
      ...insertAuditFields(res.profile.id),
    });

    if (error) return err(friendlyDbError(error.message));
    revalidatePath("/admin/images");
    return ok();
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateImage(formData: FormData): Promise<ActionResult> {
  try {
    const res = await requireSuperadmin();
    if (!res.ok) return err("Not authorized");

    const id = String(formData.get("id") ?? "").trim();
    if (!id) return err("Missing id");

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

    Object.assign(patch, updateAuditFields(res.profile.id));

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("images").update(patch).eq("id", id);
    if (error) return err(friendlyDbError(error.message));
    revalidatePath("/admin/images");
    return ok();
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function deleteImage(formData: FormData): Promise<ActionResult> {
  try {
    const res = await requireSuperadmin();
    if (!res.ok) return err("Not authorized");

    const id = String(formData.get("id") ?? "").trim();
    if (!id) return err("Missing id");

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("images").delete().eq("id", id);
    if (error) return err(friendlyDbError(error.message));
    revalidatePath("/admin/images");
    return ok();
  } catch (e) {
    return err(toErrorMessage(e));
  }
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

