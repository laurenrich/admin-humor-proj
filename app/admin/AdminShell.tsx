"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "./actions";

const NAV_SECTIONS: { title: string; items: { href: string; label: string }[] }[] = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/humor-flavors", label: "Humor flavors" },
      { href: "/admin/humor-flavor-steps", label: "Flavor steps" },
      { href: "/admin/humor-mix", label: "Humor mix" },
      { href: "/admin/terms", label: "Terms" },
    ],
  },
  {
    title: "Media & captions",
    items: [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/images", label: "Images" },
      { href: "/admin/captions", label: "Captions" },
      { href: "/admin/caption-requests", label: "Caption requests" },
      { href: "/admin/caption-examples", label: "Caption examples" },
    ],
  },
  {
    title: "LLM",
    items: [
      { href: "/admin/llm-models", label: "LLM models" },
      { href: "/admin/llm-providers", label: "LLM providers" },
      { href: "/admin/llm-prompt-chains", label: "LLM prompt chains" },
      { href: "/admin/llm-responses", label: "LLM responses" },
    ],
  },
  {
    title: "Access",
    items: [
      { href: "/admin/allowed-signup-domains", label: "Allowed signup domains" },
      { href: "/admin/whitelisted-emails", label: "Whitelisted emails" },
    ],
  },
];

function navActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin" || pathname === "/admin/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-6 px-3 py-2">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">
            {section.title}
          </div>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = navActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={[
                      "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                        : "text-zinc-700 hover:bg-zinc-200/70 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_100%_60%_at_100%_-10%,rgba(99,102,241,0.08),transparent)] dark:bg-[radial-gradient(ellipse_100%_60%_at_100%_-10%,rgba(99,102,241,0.06),transparent)] lg:h-dvh lg:max-h-dvh lg:min-h-0 lg:overflow-hidden">
      {/* Mobile top bar — menu on the left matches a left drawer */}
      <header className="sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-zinc-200/80 bg-white/90 px-3 py-3 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90 lg:hidden">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMenuOpen((o) => !o)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {menuOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
        <Link
          href="/admin"
          className="min-w-0 truncate text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          onClick={closeMenu}
        >
          Humor Admin
        </Link>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Backdrop (mobile) — tap to close */}
        {menuOpen ? (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
            onClick={closeMenu}
          />
        ) : null}

        {/* Left sidebar — height-bounded so the nav scrolls; flex min-h-0 avoids content-sized growth */}
        <aside
          className={[
            "fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-[min(20rem,100vw)] max-w-full flex-col overflow-hidden border-r border-zinc-200/90 bg-zinc-50 shadow-2xl transition-transform duration-200 ease-out dark:border-zinc-800/90 dark:bg-zinc-950 dark:shadow-black/50",
            menuOpen ? "translate-x-0" : "-translate-x-full",
            "lg:static lg:z-0 lg:h-full lg:max-h-full lg:min-h-0 lg:w-64 lg:max-w-none lg:translate-x-0 lg:shadow-none xl:w-72",
          ].join(" ")}
        >
          <div className="flex h-14 shrink-0 items-center border-b border-zinc-200/90 px-5 dark:border-zinc-800/80 lg:h-16">
            <Link
              href="/admin"
              className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
              onClick={closeMenu}
            >
              Humor Admin
            </Link>
          </div>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain py-4 [scrollbar-gutter:stable]">
            <SidebarNav pathname={pathname} onNavigate={closeMenu} />
          </div>

          <div className="shrink-0 border-t border-zinc-200/90 bg-white/60 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/80">
            <form action={signOut}>
              <button
                type="submit"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        {/* Main — only this column scrolls on desktop so the sidebar can keep its own scroll */}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-white/40 px-4 py-6 sm:px-6 lg:bg-transparent lg:px-10 lg:py-9 dark:bg-zinc-950/40 dark:lg:bg-transparent">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
