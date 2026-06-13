"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Explore", match: (pathname: string) => pathname === "/" },
  {
    href: "/planner",
    label: "Module Planner",
    match: (pathname: string) => pathname.startsWith("/planner") || pathname.startsWith("/results") || pathname.startsWith("/universities/"),
  },
];

function BookIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7 text-[var(--foreground)]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.75 5.75C4.75 4.7835 5.5335 4 6.5 4H10.25C11.6307 4 12.75 5.11929 12.75 6.5V19.25H7.25C5.86929 19.25 4.75 18.1307 4.75 16.75V5.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.25 5.75C19.25 4.7835 18.4665 4 17.5 4H13.75C12.3693 4 11.25 5.11929 11.25 6.5V19.25H16.75C18.1307 19.25 19.25 18.1307 19.25 16.75V5.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--line)] bg-[var(--background)]">
      <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between px-8 py-5 md:px-12">
        <Link href="/" className="flex items-center gap-3 text-[2rem] font-semibold leading-none tracking-[-0.03em] text-[var(--foreground)]">
          <BookIcon />
          <span className="font-[family-name:var(--font-display)] text-[2.1rem]">MappedOut</span>
        </Link>

        <nav className="flex items-center gap-10 text-[1.15rem] text-[var(--muted-foreground)]">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative pb-4 transition ${active ? "font-medium text-[var(--foreground)]" : "hover:text-[var(--foreground)]"}`}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-0 -bottom-[22px] h-[4px] rounded-full bg-[var(--foreground)]" />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
