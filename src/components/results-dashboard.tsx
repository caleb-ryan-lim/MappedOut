"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ResultsProps = {
  request: {
    nusModuleCodes: string[];
    targetSemester?: string;
    preferredCountries?: string[];
    minimumClassification?: string;
    overseasOnly?: boolean;
  };
};

type ApiResponse = {
  inputModules: string[];
  unresolvedModules: string[];
  rankedUniversities: Array<{
    partnerUniversityId: string;
    name: string;
    country: string | null;
    strongMappingCount: number;
    possibleMappingCount: number;
    averageConfidence: number;
    warnings: string[];
    unmappedModules: string[];
    moduleMappings: Array<{
      nusModuleCode: string;
      courseCode: string;
      title: string;
      confidence: number;
      classification: string;
      explanation: string;
      warnings: string[];
      sourceUrls: string[];
      historicalEvidence: {
        foundInExcel: boolean;
        preApprovalStatus: string | null;
        sourceRowNumbers: number[];
      };
      scoreBreakdown: Record<string, number>;
    }>;
  }>;
};

export function ResultsDashboard({ request }: ResultsProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const detailQuery = new URLSearchParams({
    modules: request.nusModuleCodes.join(","),
    semester: request.targetSemester ?? "",
    countries: request.preferredCountries?.join(",") ?? "",
    minimumClassification: request.minimumClassification ?? "possible",
    overseasOnly: String(request.overseasOnly ?? true),
  }).toString();

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "Unable to rank universities.");
        }
        return response.json();
      })
      .then((payload) => setData(payload))
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      });

    return () => controller.abort();
  }, [request]);

  if (error) {
    return (
      <div className="glass-panel rounded-[2rem] p-8">
        <p className="text-lg font-semibold">We hit a blocker.</p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{error}</p>
        <p className="mt-4 text-sm text-[var(--ink-soft)]">
          Make sure your database is migrated and your historical mappings have been imported from the admin page.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel rounded-[2rem] p-8">
        <p className="text-lg font-semibold">Crunching mapping evidence...</p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          MappedOut is checking NUSMods metadata, historical SoC mappings, and current catalogue evidence.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[2rem] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
              Recommendation view
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl leading-none md:text-6xl">
              Ranked partner universities
            </h1>
          </div>
          <Link href="/" className="rounded-full border border-[var(--line)] px-4 py-2 text-sm">
            Adjust inputs
          </Link>
        </div>
        <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
          This tool provides mapping recommendations only. Final approval is determined by NUS and the relevant
          course hosts. Historical mappings are indicative and may not carry over to future semesters.
        </p>
        {data.unresolvedModules.length > 0 ? (
          <p className="mt-3 text-sm text-[var(--warning)]">
            Unresolved modules: {data.unresolvedModules.join(", ")}. Verify those codes in NUSMods.
          </p>
        ) : null}
      </div>

      {data.rankedUniversities.map((university, index) => (
        <section key={university.partnerUniversityId} className="glass-panel overflow-hidden rounded-[2rem]">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
                    Rank #{index + 1}
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl leading-none">
                    {university.name}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {university.country ?? "Country unknown"}
                  </p>
                </div>
                <Link
                  href={`/universities/${university.partnerUniversityId}?${detailQuery}`}
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium"
                >
                  Open detail page
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">Strong</p>
                  <p className="mt-2 text-2xl font-semibold">{university.strongMappingCount}</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">Possible</p>
                  <p className="mt-2 text-2xl font-semibold">{university.possibleMappingCount}</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">Avg score</p>
                  <p className="mt-2 text-2xl font-semibold">{Math.round(university.averageConfidence * 100)}%</p>
                </div>
              </div>

              <div className="space-y-3">
                {university.moduleMappings.slice(0, 3).map((mapping) => (
                  <div
                    key={`${university.partnerUniversityId}-${mapping.nusModuleCode}`}
                    className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-strong)] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                          {mapping.nusModuleCode}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold">
                          {mapping.courseCode} - {mapping.title}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                          {mapping.classification}
                        </p>
                        <p className="mt-1 text-xl font-semibold">
                          {Math.round(mapping.confidence * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {university.unmappedModules.length > 0 ? (
                <p className="text-sm text-[var(--ink-soft)]">
                  Unmapped here: {university.unmappedModules.join(", ")}
                </p>
              ) : null}
            </div>

            <div className="flex min-h-72 flex-col justify-between bg-[radial-gradient(circle_at_top,_rgba(255,213,163,0.44),_transparent_30%),linear-gradient(180deg,_rgba(245,236,225,0.96),_rgba(232,220,204,0.84))] p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                  Lead mapping signal
                </p>
                <p className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-none">
                  {university.moduleMappings[0]?.courseCode ?? "No strong match yet"}
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                  {university.moduleMappings[0]?.explanation ??
                    "This partner still needs more evidence before it becomes a strong recommendation."}
                </p>
              </div>

              <div className="space-y-3">
                {university.warnings.slice(0, 3).map((warning) => (
                  <p
                    key={warning}
                    className="rounded-[1.2rem] border border-[var(--line)] bg-[color:rgba(255,255,255,0.55)] px-4 py-3 text-sm text-[var(--ink-soft)]"
                  >
                    {warning}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
