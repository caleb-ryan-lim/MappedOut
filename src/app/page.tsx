import { ExploreUniversities } from "@/components/explore-universities";

export default function HomePage() {
  return (
    <main className="display-grid min-h-screen">
      <div className="page-shell">
        <section className="mx-auto max-w-5xl pt-10 text-center md:pt-16">
          <div className="mx-auto inline-flex items-center rounded-full bg-[var(--accent)] px-6 py-3 text-lg text-[var(--foreground)]">
            NUS Overseas Exchange Programme
          </div>
          <h1 className="mt-10 font-[family-name:var(--font-display)] text-6xl leading-[0.95] tracking-[-0.04em] text-[var(--foreground)] md:text-[7.5rem]">
            Find your perfect
            <br />
            exchange university
          </h1>
          <p className="mx-auto mt-8 max-w-4xl text-2xl leading-relaxed text-[var(--muted-foreground)] md:text-[2.1rem]">
            Browse NUS partner universities worldwide. Use the{" "}
            <a className="underline underline-offset-4" href="/planner">
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
