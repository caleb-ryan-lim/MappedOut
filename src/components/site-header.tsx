"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Explore", match: (pathname: string) => pathname === "/" },
  {
    href: "/planner",
    label: "Module Planner",
    match: (pathname: string) =>
      pathname.startsWith("/planner") ||
      pathname.startsWith("/results") ||
      pathname.startsWith("/universities/"),
  },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--background)]/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-6 py-3 md:px-10">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--foreground)]"
        >
          MappedOut
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-lg px-4 py-2 text-sm transition-colors ${
                  active
                    ? "font-medium text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-2 -bottom-[13px] h-0.5 rounded-full bg-[var(--foreground)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
