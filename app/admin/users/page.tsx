import { requireSuperadminOrRedirect } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { type ProfileRow } from "./actions";
import UsersClient from "./UsersClient";

const PAGE_SIZE = 200;

export default async function AdminUsersPage() {
  await requireSuperadminOrRedirect();
  const admin = createSupabaseAdminClient();

  const { data: users, error } = await admin
    .from("profiles")
    .select(
      "id,created_datetime_utc,first_name,last_name,email,is_superadmin,is_in_study,is_matrix_admin"
    )
    .order("created_datetime_utc", { ascending: false })
    .range(0, PAGE_SIZE - 1);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
        Failed to load profiles: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Read-only view of `profiles`.
        </p>
      </div>

      <UsersClient initialRows={(users ?? []) as ProfileRow[]} />
    </div>
  );
}

