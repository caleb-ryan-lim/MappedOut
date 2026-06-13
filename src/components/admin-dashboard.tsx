"use client";

import { useEffect, useState } from "react";

type JsonRecord = Record<string, unknown>;

export function AdminDashboard() {
  const [message, setMessage] = useState("");
  const [imports, setImports] = useState<JsonRecord[]>([]);
  const [jobs, setJobs] = useState<JsonRecord[]>([]);
  const [includeLocal, setIncludeLocal] = useState(false);

  async function refresh() {
    const [importsResponse, jobsResponse] = await Promise.all([
      fetch("/api/admin/imports"),
      fetch("/api/admin/scrape-jobs"),
    ]);
    setImports((await importsResponse.json()).imports);
    setJobs((await jobsResponse.json()).jobs);
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const [importsResponse, jobsResponse] = await Promise.all([
        fetch("/api/admin/imports"),
        fetch("/api/admin/scrape-jobs"),
      ]);

      if (!isMounted) {
        return;
      }

      setImports((await importsResponse.json()).imports);
      setJobs((await jobsResponse.json()).jobs);
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/import/historical-mappings", { method: "POST", body: formData });
    const payload = await response.json();
    setMessage(response.ok ? "Historical mappings imported." : payload.error);
    await refresh();
  }

  async function handlePartnerScrape() {
    const response = await fetch("/api/scrape/nus-partners", { method: "POST" });
    const payload = await response.json();
    setMessage(response.ok ? `Refreshed ${payload.importedPartners} partners.` : payload.error);
    await refresh();
  }

  async function handleCourseScrape() {
    const response = await fetch("/api/scrape/partner-courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        limit: 5,
        priorityFromHistoricalMappings: true,
        includeLocal,
      }),
    });
    const payload = await response.json();
    setMessage(response.ok ? `Scraped ${payload.processedPartnerCount} partner universities.` : payload.error);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[2rem] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">Admin</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl leading-none md:text-6xl">
          Data operations
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
          Import the historical SoC SEP workbook first, then refresh NUS partners, then trigger Bright Data discovery
          and pilot scraping for a focused subset of universities.
        </p>
        {message ? <p className="mt-4 text-sm text-[var(--success)]">{message}</p> : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={handleImport} className="glass-panel rounded-[2rem] p-6">
          <h2 className="text-xl font-semibold">Historical Excel import</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Upload `SoC SEP mapping list excel.xlsx` or a CSV export of the same sheet structure.
          </p>
          <input
            type="file"
            name="file"
            accept=".xlsx,.csv"
            className="mt-5 block w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3"
          />
          <button className="mt-4 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white">
            Import historical mappings
          </button>
        </form>

        <div className="glass-panel rounded-[2rem] p-6">
          <h2 className="text-xl font-semibold">Scraping controls</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Bright Data is used for course discovery and markdown scraping of partner catalogue pages. This route is the plan-compliant scraping path for current partner evidence.
          </p>
          <div className="mt-5 space-y-4">
            <button
              type="button"
              onClick={handlePartnerScrape}
              className="w-full rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold"
            >
              Refresh NUS partner universities
            </button>
            <label className="flex items-center gap-3 rounded-[1.2rem] border border-[var(--line)] px-4 py-3">
              <input
                type="checkbox"
                checked={includeLocal}
                onChange={(event) => setIncludeLocal(event.target.checked)}
              />
              <span className="text-sm">Include local exchange / local partner institutions</span>
            </label>
            <button
              type="button"
              onClick={handleCourseScrape}
              className="w-full rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
            >
              Run pilot partner course scrape
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="glass-panel rounded-[2rem] p-6">
          <h2 className="text-xl font-semibold">Import history</h2>
          <div className="mt-4 space-y-3 text-sm">
            {imports.map((entry, index) => (
              <pre key={index} className="overflow-x-auto rounded-2xl border border-[var(--line)] p-4 text-xs">
                {JSON.stringify(entry, null, 2)}
              </pre>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] p-6">
          <h2 className="text-xl font-semibold">Scrape jobs</h2>
          <div className="mt-4 space-y-3 text-sm">
            {jobs.map((entry, index) => (
              <pre key={index} className="overflow-x-auto rounded-2xl border border-[var(--line)] p-4 text-xs">
                {JSON.stringify(entry, null, 2)}
              </pre>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
