function BookIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-8 w-8 text-[var(--foreground)]"
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

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-white/55 px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-3 text-[var(--foreground)]">
          <BookIcon />
          <span className="font-[family-name:var(--font-display)] text-2xl">MappedOut</span>
        </div>
        <p className="text-lg text-[var(--muted-foreground)]">
          Built for NUS students. Module information is indicative — always verify with your faculty&apos;s exchange office.
        </p>
      </div>
    </footer>
  );
}
