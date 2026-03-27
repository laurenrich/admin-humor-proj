import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  /** Only allow same-origin relative paths under /admin */
  const next =
    nextParam &&
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//") &&
    nextParam.startsWith("/admin")
      ? nextParam
      : "/admin";

  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");
  if (error || errorDescription) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", errorDescription ?? error ?? "OAuth error");
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "Missing OAuth code");
    return NextResponse.redirect(loginUrl);
  }

  // Route Handlers need explicit request/response cookie plumbing so that
  // exchangeCodeForSession() and signOut() reliably persist.
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", exchangeError.message);
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", userError?.message ?? "Missing user after login");
    return NextResponse.redirect(loginUrl);
  }

  // Enforce superadmin at login-time (not just route-time).
  // If they're not a superadmin, immediately sign them out and bounce to login.
  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.is_superadmin) {
    await supabase.auth.signOut();
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("reason", "not_superadmin");
    const redirectRes = NextResponse.redirect(loginUrl);
    // Copy any cookie mutations (including signOut) onto redirect response.
    for (const c of response.cookies.getAll()) {
      redirectRes.cookies.set(c.name, c.value);
    }
    return redirectRes;
  }

  const redirectRes = NextResponse.redirect(new URL(next, url.origin).toString());
  for (const c of response.cookies.getAll()) {
    redirectRes.cookies.set(c.name, c.value);
  }
  return redirectRes;
}

