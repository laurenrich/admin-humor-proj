import { requireSuperadminOrRedirect } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import ImagesClient from "./ImagesClient";
import { createImage } from "./actions";

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

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
        <h2 className="text-base font-semibold">Create image</h2>
        <form
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2"
          action={createImage}
        >
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              URL (required)
            </span>
            <input
              name="url"
              required
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="https://..."
            />
          </label>

          <div className="flex flex-wrap gap-4 md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input type="checkbox" name="is_public" />
              Public
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input type="checkbox" name="is_common_use" />
              Common use
            </label>
          </div>

          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Additional context
            </span>
            <textarea
              name="additional_context"
              rows={3}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Image description
            </span>
            <textarea
              name="image_description"
              rows={3}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Celebrity recognition
            </span>
            <textarea
              name="celebrity_recognition"
              rows={3}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          <div className="md:col-span-2 flex items-center justify-end">
            <button className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100">
              Create
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          Failed to load images: {error.message}
        </div>
      ) : null}

      <ImagesClient initialRows={(images ?? []) as any} />
    </div>
  );
}

