import { redirect } from "next/navigation";

function first(v: string | string[] | undefined) {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const code = first(sp.code);
  const error = first(sp.error);
  const error_description = first(sp.error_description);
  const next = first(sp.next);

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
