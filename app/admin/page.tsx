import { requireSuperadminOrRedirect } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function formatUtcShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

const nf = new Intl.NumberFormat("en-US");

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
      <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      {hint ? (
        <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminHomePage() {
  return <AdminDashboard />;
}

async function AdminDashboard() {
  const { profile } = await requireSuperadminOrRedirect();
  const admin = createSupabaseAdminClient();

  const [
    profilesCount,
    inStudyCount,
    imagesCount,
    imagesPublicCount,
    captionsCount,
    captionsPublicCount,
    featuredCaptionsCount,
    topCaptions,
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_in_study", true),
    admin.from("images").select("*", { count: "exact", head: true }),
    admin
      .from("images")
      .select("*", { count: "exact", head: true })
      .eq("is_public", true),
    admin.from("captions").select("*", { count: "exact", head: true }),
    admin
      .from("captions")
      .select("*", { count: "exact", head: true })
      .eq("is_public", true),
    admin
      .from("captions")
      .select("*", { count: "exact", head: true })
      .eq("is_featured", true),
    admin
      .from("captions")
      .select("id,content,like_count,image_id,is_public,is_featured,created_datetime_utc")
      .order("like_count", { ascending: false, nullsFirst: false })
      .limit(8),
  ]);

  const totalProfiles = profilesCount.count ?? 0;
  const totalInStudy = inStudyCount.count ?? 0;
  const totalImages = imagesCount.count ?? 0;
  const totalImagesPublic = imagesPublicCount.count ?? 0;
  const totalCaptions = captionsCount.count ?? 0;
  const totalCaptionsPublic = captionsPublicCount.count ?? 0;
  const totalFeatured = featuredCaptionsCount.count ?? 0;

  const imagesPublicPct =
    totalImages === 0 ? 0 : Math.round((totalImagesPublic / totalImages) * 100);
  const captionsPublicPct =
    totalCaptions === 0
      ? 0
      : Math.round((totalCaptionsPublic / totalCaptions) * 100);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Signed in as{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {profile.email ?? profile.first_name ?? profile.id}
          </span>
          .
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Profiles"
          value={nf.format(totalProfiles)}
          hint={`${nf.format(totalInStudy)} in study`}
        />
        <StatCard
          label="Images"
          value={nf.format(totalImages)}
          hint={`${imagesPublicPct}% public`}
        />
        <StatCard
          label="Captions"
          value={nf.format(totalCaptions)}
          hint={`${captionsPublicPct}% public`}
        />
        <StatCard
          label="Featured captions"
          value={nf.format(totalFeatured)}
          hint="Shown on landing page"
        />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-base font-semibold">Top captions by likes</h2>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            like_count-driven leaderboard
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {(topCaptions.data ?? []).map((c) => {
            const content = (c.content ?? "").trim();
            const preview =
              content.length > 180 ? `${content.slice(0, 180)}…` : content || "(empty)";
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatUtcShort(c.created_datetime_utc)}
                  </div>
                  <div className="flex items-center gap-2">
                    {c.is_featured ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                        Featured
                      </span>
                    ) : null}
                    {c.is_public ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200">
                        Public
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                        Private
                      </span>
                    )}
                    <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-white dark:text-black">
                      {nf.format(Number(c.like_count ?? 0))} likes
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-sm leading-6 text-zinc-900 dark:text-zinc-50">
                  {preview}
                </div>
                <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  caption_id: <span className="font-mono">{c.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}


