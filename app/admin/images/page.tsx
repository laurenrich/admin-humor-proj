import { requireSuperadminOrRedirect } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import ImagesClient from "./ImagesClient";
import CreateImageClient from "./CreateImageClient";
import { type ImageRow } from "./actions";

const PAGE_SIZE = 100;

export default async function AdminImagesPage() {
  await requireSuperadminOrRedirect();
  const admin = createSupabaseAdminClient();

  const { data: images, error } = await admin
    .from("images")
    .select(
      "id,created_datetime_utc,url,is_public,is_common_use,profile_id,additional_context,image_description,celebrity_recognition"
    )
    .order("created_datetime_utc", { ascending: false })
    .range(0, PAGE_SIZE - 1);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Images</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create/read/update/delete for `images`.
        </p>
      </div>

      <CreateImageClient />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          Failed to load images: {error.message}
        </div>
      ) : null}

      <ImagesClient
        key={(images?.[0]?.id as string | undefined) ?? "empty"}
        initialRows={(images ?? []) as ImageRow[]}
      />
    </div>
  );
}

