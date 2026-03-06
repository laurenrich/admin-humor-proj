import Link from "next/link";
import { signOut } from "./actions";
import { requireSuperadminOrRedirect } from "@/lib/auth/requireSuperadmin";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
    >
      {children}
    </Link>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperadminOrRedirect();
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-900 dark:bg-black/70">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm font-semibold tracking-wide">
              Humor Admin
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink href="/admin">Dashboard</NavLink>
              <NavLink href="/admin/users">Users</NavLink>
              <NavLink href="/admin/images">Images</NavLink>
              <NavLink href="/admin/captions">Captions</NavLink>
            </nav>
          </div>

          <form action={signOut}>
            <button className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

