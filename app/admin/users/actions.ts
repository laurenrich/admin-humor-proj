"use server";

import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ProfileRow = {
  id: string;
  created_datetime_utc: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_superadmin: boolean | null;
  is_in_study: boolean | null;
  is_matrix_admin: boolean | null;
};

const PAGE_SIZE = 200;

export async function fetchProfilesPage(page: number): Promise<ProfileRow[]> {
  const res = await requireSuperadmin();
  if (!res.ok) throw new Error("Not authorized");

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 0;
  const from = safePage * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select(
      "id,created_datetime_utc,first_name,last_name,email,is_superadmin,is_in_study,is_matrix_admin"
    )
    .order("created_datetime_utc", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return (data ?? []) as ProfileRow[];
}

