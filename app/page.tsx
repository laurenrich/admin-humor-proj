import { redirect } from "next/navigation";

function first(v: string | string[] | undefined) {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export default function Home({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const code = first(searchParams?.code);
  const error = first(searchParams?.error);
  const error_description = first(searchParams?.error_description);
  const next = first(searchParams?.next);

  // If Supabase redirects to "/" with OAuth params, forward them to our callback handler.
  if (code || error || error_description) {
    const qp = new URLSearchParams();
    if (code) qp.set("code", code);
    if (error) qp.set("error", error);
    if (error_description) qp.set("error_description", error_description);
    if (next) qp.set("next", next);
    redirect(`/auth/callback?${qp.toString()}`);
  }

  redirect("/admin");
}
