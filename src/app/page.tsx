import { ExploreUniversities } from "@/components/explore-universities";

export default function HomePage() {
  return (
    <main className="display-grid min-h-screen">
      <div className="page-shell">
        <section className="mx-auto max-w-3xl pt-8 text-center md:pt-12">
          <div className="mx-auto inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-1.5 text-sm text-[var(--muted-foreground)]">
            NUS Overseas Exchange Programme
          </div>
          <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight tracking-tight text-[var(--foreground)] md:text-6xl">
            Find your perfect
            <br />
            exchange university
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            Browse NUS partner universities worldwide. Use the{" "}
            <a className="underline underline-offset-4 hover:text-[var(--foreground)]" href="/planner">
              Module Planner
            </a>{" "}
            to match your NUS modules to partner equivalents.
          </p>
        </section>

        <ExploreUniversities />
      </div>
    </main>
  );
}
