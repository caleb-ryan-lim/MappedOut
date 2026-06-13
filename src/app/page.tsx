import Link from "next/link";

import { FeaturedUniversities } from "@/components/featured-universities";
import { ModulePlannerForm } from "@/components/module-planner-form";

export default function HomePage() {
  return (
    <main className="display-grid min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-8 md:px-8">
        <section className="grid flex-1 gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <ModulePlannerForm />

          <div className="space-y-6">
            <section className="glass-panel rounded-[2rem] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
                How it works
              </p>
              <ol className="mt-4 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
                <li>1. Import the historical SoC SEP mapping workbook.</li>
                <li>2. Refresh NUS partner universities and scrape pilot course catalogues with Bright Data.</li>
                <li>3. Enter NUS module codes and compare ranked evidence across partners.</li>
              </ol>
            </section>

            <section className="glass-panel rounded-[2rem] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
                Signals used
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
                <li>Historical approval status from SoC SEP mappings.</li>
                <li>Current NUSMods metadata for module description and workload.</li>
                <li>Bright Data search and markdown scraping of official partner course pages.</li>
                <li>Transparent score breakdown with restriction penalties and warnings.</li>
              </ul>
            </section>

            <section className="glass-panel rounded-[2rem] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
                Official context
              </p>
              <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                Recommendations come with warnings because this tool does not replace NUS approval. Treat it as a shortlist builder, not an approval engine.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/admin"
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium"
                >
                  Admin
                </Link>
                <a
                  href="https://www.comp.nus.edu.sg/programmes/ug/beyond/global/course-mappings/"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium"
                >
                  NUS source
                </a>
              </div>
            </section>
          </div>
        </section>

        <FeaturedUniversities />
      </div>
    </main>
  );
}
