import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireSuperadmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, user: null };

  const admin = createSupabaseAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id,is_superadmin,email,first_name,last_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return { ok: false as const, user };
  if (!profile?.is_superadmin) return { ok: false as const, user };

  return { ok: true as const, user, profile };
}

export async function requireSuperadminOrRedirect() {
  const res = await requireSuperadmin();
  if (!res.ok) redirect("/login?reason=not_superadmin");
  return res;
}

