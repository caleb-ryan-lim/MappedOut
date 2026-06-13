"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type UniversityDetailViewProps = {
  partnerUniversityId: string;
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

export function UniversityDetailView({
  partnerUniversityId,
  request,
}: UniversityDetailViewProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          throw new Error(payload?.error ?? "Unable to load university detail.");
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

  const university = useMemo(
    () =>
      data?.rankedUniversities.find(
        (entry) => entry.partnerUniversityId === partnerUniversityId,
      ) ?? null,
    [data, partnerUniversityId],
  );

  if (error) {
    return (
      <section className="glass-panel rounded-[2rem] p-8">
        <p className="text-lg font-semibold">We hit a blocker.</p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{error}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="glass-panel rounded-[2rem] p-8">
        <p className="text-lg font-semibold">Loading university detail...</p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Pulling current ranking evidence for this partner.
        </p>
      </section>
    );
  }

  if (!university) {
    return (
      <section className="glass-panel rounded-[2rem] p-8">
        <p className="text-lg font-semibold">This university is not in the current shortlist.</p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Try broadening your filters or go back to the results page.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel overflow-hidden rounded-[2.2rem]">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5 p-6 md:p-8">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
                Dedicated detail page
              </p>
              <h1 className="font-[family-name:var(--font-display)] text-4xl leading-none md:text-6xl">
                {university.name}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
                Review confidence, historical evidence, warnings, and source URLs for every candidate mapping before using this partner in your SEP plan.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard label="Strong mappings" value={String(university.strongMappingCount)} />
              <MetricCard label="Possible mappings" value={String(university.possibleMappingCount)} />
              <MetricCard
                label="Average confidence"
                value={`${Math.round(university.averageConfidence * 100)}%`}
              />
            </div>
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-strong)] px-5 py-4 text-sm leading-7 text-[var(--ink-soft)]">
              This tool provides mapping recommendations only. Final approval is determined by NUS and the relevant course hosts. Historical mappings are indicative and may not carry over to future semesters.
            </div>
          </div>
          <div className="min-h-72 bg-[radial-gradient(circle_at_top,_rgba(255,213,163,0.44),_transparent_32%),linear-gradient(180deg,_rgba(194,116,62,0.12),_rgba(255,255,255,0.04))]" />
        </div>
      </div>

      {university.moduleMappings.map((mapping) => (
        <article key={`${university.partnerUniversityId}-${mapping.nusModuleCode}`} className="glass-panel rounded-[2rem] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                {mapping.nusModuleCode}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl leading-none">
                {mapping.courseCode} / {mapping.title}
              </h2>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-strong)] px-5 py-4 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                {mapping.classification}
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {Math.round(mapping.confidence * 100)}%
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{mapping.explanation}</p>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <InfoPanel title="Historical evidence">
              <p>Found in workbook: {mapping.historicalEvidence.foundInExcel ? "Yes" : "No"}</p>
              <p>Status: {mapping.historicalEvidence.preApprovalStatus ?? "UNKNOWN"}</p>
              <p>
                Source rows:{" "}
                {mapping.historicalEvidence.sourceRowNumbers.length
                  ? mapping.historicalEvidence.sourceRowNumbers.join(", ")
                  : "None"}
              </p>
            </InfoPanel>
            <InfoPanel title="Score breakdown">
              {Object.entries(mapping.scoreBreakdown).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span>{key}</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {value.toFixed(2)}
                  </span>
                </div>
              ))}
            </InfoPanel>
            <InfoPanel title="Warnings and sources">
              {mapping.warnings.length ? (
                <div className="space-y-1">
                  {mapping.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : (
                <p>No immediate warnings for this mapping.</p>
              )}
              <div className="mt-4 space-y-1">
                {mapping.sourceUrls.map((url) => (
                  <a
                    key={url}
                    className="block truncate text-[var(--accent)]"
                    href={url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {url}
                  </a>
                ))}
              </div>
            </InfoPanel>
          </div>
        </article>
      ))}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--ink-soft)]">
          Unmapped modules here: {university.unmappedModules.join(", ") || "None"}
        </p>
        <Link href="/results" className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium">
          Back to results
        </Link>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-strong)] px-5 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function InfoPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-strong)] p-4 text-sm leading-7 text-[var(--ink-soft)]">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        {title}
      </p>
      {children}
    </div>
  );
}
