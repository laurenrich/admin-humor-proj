import { requireSuperadminOrRedirect } from "@/lib/auth/requireSuperadmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchCaptionAnalyticsBundle } from "./_lib/dashboardAnalytics";
import { FlavorBarChart, TopCaptionsList } from "./_components/DashboardSections";

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
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm transition hover:border-zinc-300/80 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
      <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </div>
      {hint ? (
        <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{hint}</div>
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
    captionsCount,
    featuredCaptionsCount,
    analytics,
    topByLikes,
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_in_study", true),
    admin.from("images").select("*", { count: "exact", head: true }),
    admin.from("captions").select("*", { count: "exact", head: true }),
    admin
      .from("captions")
      .select("*", { count: "exact", head: true })
      .eq("is_featured", true),
    fetchCaptionAnalyticsBundle(admin),
    admin
      .from("captions")
      .select("id,content,like_count,created_datetime_utc")
      .order("like_count", { ascending: false, nullsFirst: false })
      .limit(5),
  ]);

  const totalProfiles = profilesCount.count ?? 0;
  const totalInStudy = inStudyCount.count ?? 0;
  const totalImages = imagesCount.count ?? 0;
  const totalCaptions = captionsCount.count ?? 0;
  const totalFeatured = featuredCaptionsCount.count ?? 0;

  const topLeaderRows = (topByLikes.data ?? []) as {
    id: string;
    content: string | null;
    like_count: number | null;
    created_datetime_utc: string;
  }[];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {profile.email ?? profile.first_name ?? profile.id}
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Profiles"
          value={nf.format(totalProfiles)}
          hint={`${nf.format(totalInStudy)} in study`}
        />
        <StatCard label="Images" value={nf.format(totalImages)} hint="In the image library" />
        <StatCard label="Captions" value={nf.format(totalCaptions)} hint="All caption rows" />
        <StatCard
          label="Featured"
          value={nf.format(totalFeatured)}
          hint="Pinned for discovery / landing"
        />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <FlavorBarChart
          rows={analytics.topFlavors}
          emptyHint="No flavor tags in this window — captions need humor_flavor_id set."
        />
        <TopCaptionsList rows={topLeaderRows} />
      </div>
    </div>
  );
}
