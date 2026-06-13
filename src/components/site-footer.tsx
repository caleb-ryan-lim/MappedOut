export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)] px-6 py-8">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-2 text-center md:flex-row md:justify-between md:text-left">
        <span className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--foreground)]">
          MappedOut
        </span>
        <p className="text-xs text-[var(--muted-foreground)]">
          Built for NUS students. Module information is indicative — verify with your faculty&apos;s exchange office.
        </p>
      </div>
    </footer>
  );
}
