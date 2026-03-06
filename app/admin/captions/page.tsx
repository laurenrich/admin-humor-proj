import { requireSuperadminOrRedirect } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import CaptionsClient from "./CaptionsClient";

const PAGE_SIZE = 200;

export default async function AdminCaptionsPage() {
  await requireSuperadminOrRedirect();
  const admin = createSupabaseAdminClient();

  const { data: captions, error } = await admin
    .from("captions")
    .select(
      "id,created_datetime_utc,content,is_public,is_featured,like_count,profile_id,image_id,humor_flavor_id,caption_request_id,llm_prompt_chain_id"
    )
    .order("created_datetime_utc", { ascending: false })
    .range(0, PAGE_SIZE - 1);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
        Failed to load captions: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Captions</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Read-only view of `captions`.
        </p>
      </div>

      <CaptionsClient initialRows={(captions ?? []) as any} />
    </div>
  );
}

