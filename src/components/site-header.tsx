import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color:rgba(248,243,235,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.34em] text-[var(--accent)]"
        >
          MappedOut
        </Link>
        <nav className="flex items-center gap-4 text-sm text-[var(--ink-soft)]">
          <Link className="transition hover:text-[var(--foreground)]" href="/results">
            Results
          </Link>
          <Link className="transition hover:text-[var(--foreground)]" href="/admin">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
