"use server";

import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CaptionRow = {
  id: string;
  created_datetime_utc: string;
  content: string | null;
  is_public: boolean | null;
  is_featured: boolean | null;
  like_count: number | null;
  profile_id: string | null;
  image_id: string | null;
  humor_flavor_id: string | null;
  caption_request_id: string | null;
  llm_prompt_chain_id: string | null;
};

const PAGE_SIZE = 200;

export async function fetchCaptionsPage(page: number): Promise<CaptionRow[]> {
  const res = await requireSuperadmin();
  if (!res.ok) throw new Error("Not authorized");

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 0;
  const from = safePage * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("captions")
    .select(
      "id,created_datetime_utc,content,is_public,is_featured,like_count,profile_id,image_id,humor_flavor_id,caption_request_id,llm_prompt_chain_id"
    )
    .order("created_datetime_utc", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return (data ?? []) as CaptionRow[];
}

