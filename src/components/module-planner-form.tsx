"use client";

import { useState } from "react";
import Link from "next/link";

type ModuleEntry = { code: string; title: string };

type ModuleMapping = {
  nusModuleCode: string;
  courseCode: string;
  title: string;
  confidence: number;
  classification: string;
  explanation: string;
};

type RankedUniversity = {
  partnerUniversityId: string;
  name: string;
  country: string | null;
  strongMappingCount: number;
  possibleMappingCount: number;
  averageConfidence: number;
  unmappedModules: string[];
  moduleMappings: ModuleMapping[];
};

type ApiResponse = {
  rankedUniversities: RankedUniversity[];
  unresolvedModules: string[];
  emptyState?: { title: string; message: string } | null;
  browseMode?: boolean;
};

type ErrorPayload = {
  error: string;
  errorCode?: string;
  readiness?: { guidance: string[] };
};

type ViewMode = "plan" | "loading" | "results";

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M19 12H5M11 18L5 12L11 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function StrongIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function PossibleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

function UnmappedIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 9L15 15M15 9L9 15" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function normalizeEntries(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((e) => e.trim().toUpperCase())
    .filter(Boolean);
}

function confidenceIcon(classification: string, confidence: number) {
  if (classification === "strong" || confidence >= 0.7) return <StrongIcon />;
  if (classification === "possible" || confidence >= 0.4) return <PossibleIcon />;
  return <UnmappedIcon />;
}

export function ModulePlannerForm() {
  const [entry, setEntry] = useState("");
  const [semester, setSemester] = useState("Semester 1");
  const [modules, setModules] = useState<ModuleEntry[]>([]);
  const [validating, setValidating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("plan");
  const [results, setResults] = useState<ApiResponse | null>(null);
  const [apiError, setApiError] = useState<ErrorPayload | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  async function handleAdd() {
    const codes = normalizeEntries(entry);
    if (codes.length === 0) return;
    setValidating(true);
    setErrors([]);

    const results = await Promise.all(
      codes.map(async (code) => {
        try {
          const res = await fetch(`/api/modules/${encodeURIComponent(code)}`);
          if (!res.ok) return { code, valid: false, title: "" };
          const data = (await res.json()) as { title?: string };
          return { code, valid: true, title: data.title ?? code };
        } catch {
          return { code, valid: false, title: "" };
        }
      }),
    );

    setValidating(false);
    const valid = results.filter((r) => r.valid);
    const invalid = results.filter((r) => !r.valid).map((r) => r.code);

    if (valid.length > 0) {
      setModules((prev) => {
        const existing = new Set(prev.map((m) => m.code));
        return [...prev, ...valid.filter((v) => !existing.has(v.code)).map((v) => ({ code: v.code, title: v.title }))];
      });
      setEntry("");
    }
    if (invalid.length > 0) {
      setErrors(invalid.map((c) => `"${c}" not found on NUSMods — check the code and try again.`));
    }
  }

  async function handleShowMatches() {
    if (modules.length === 0) return;
    setViewMode("loading");
    setApiError(null);
    setExpanded(new Set());

    try {
      const res = await fetch("/api/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nusModuleCodes: modules.map((m) => m.code),
          targetSemester: semester,
          overseasOnly: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data as ErrorPayload);
        setViewMode("plan");
        return;
      }
      setResults(data as ApiResponse);
      setViewMode("results");
    } catch {
      setApiError({ error: "Failed to connect to the ranking service." });
      setViewMode("plan");
    }
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const detailQuery = new URLSearchParams({
    modules: modules.map((m) => m.code).join(","),
    semester,
    overseasOnly: "true",
  }).toString();

  // ── Results view ────────────────────────────────────────────────────────────
  if (viewMode === "results" && results) {
    return (
      <section className="mx-auto max-w-4xl py-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setViewMode("plan")}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface-strong)]"
          >
            <ArrowLeftIcon />
            Back to planning
          </button>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--foreground)]">
            Matches for{" "}
            {modules.map((m) => (
              <span key={m.code} className="mx-0.5 rounded bg-[var(--surface-strong)] px-1.5 py-0.5 text-base font-normal">
                {m.code}
              </span>
            ))}
          </h1>
        </div>

        {results.unresolvedModules.length > 0 && (
          <p className="mt-3 text-xs text-[var(--warning)]">
            Could not resolve: {results.unresolvedModules.join(", ")}
          </p>
        )}

        {results.browseMode && (
          <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm">
            <p className="font-medium text-[var(--foreground)]">Browse mode — no matching history yet</p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              Showing all partner universities. Module-specific recommendations will appear once SEP mapping data is imported.
            </p>
          </div>
        )}

        {results.rankedUniversities.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center">
            <p className="font-semibold text-[var(--foreground)]">
              {results.emptyState?.title ?? "No matches found yet."}
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {results.emptyState?.message ??
                "Not enough mapping evidence in the database yet. Import historical data to see ranked universities."}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {results.rankedUniversities.map((uni, index) => {
              const isOpen = expanded.has(uni.partnerUniversityId);
              return (
                <div
                  key={uni.partnerUniversityId}
                  className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
                >
                  {/* Row header */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Rank */}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-strong)] text-xs font-semibold text-[var(--foreground)]">
                      {index + 1}
                    </span>

                    {/* Name + location */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">{uni.name}</p>
                      {uni.country && (
                        <p className="text-xs text-[var(--muted-foreground)]">{uni.country}</p>
                      )}
                    </div>

                    {/* Module fulfillment icons */}
                    <div className="hidden items-center gap-2 sm:flex">
                      {modules.map((mod) => {
                        const mapping = uni.moduleMappings.find((m) => m.nusModuleCode === mod.code);
                        const isUnmapped = uni.unmappedModules.includes(mod.code);
                        return (
                          <div key={mod.code} className="flex items-center gap-1" title={`${mod.code}${mapping ? ` → ${mapping.courseCode}` : " — not mapped"}`}>
                            {mapping
                              ? confidenceIcon(mapping.classification, mapping.confidence)
                              : isUnmapped
                              ? <UnmappedIcon />
                              : <PossibleIcon />}
                            <span className="text-xs text-[var(--muted-foreground)]">{mod.code}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Stats */}
                    <div className="hidden items-center gap-3 text-xs text-[var(--muted-foreground)] lg:flex">
                      <span className="text-emerald-600">
                        {uni.strongMappingCount} strong
                      </span>
                      <span className="text-amber-500">
                        {uni.possibleMappingCount} possible
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/universities/${uni.partnerUniversityId}?${detailQuery}`}
                        className="rounded-lg border border-[var(--line)] px-3 py-1 text-xs text-[var(--foreground)] hover:bg-[var(--surface-strong)]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View uni →
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleExpanded(uni.partnerUniversityId)}
                        className="rounded-lg border border-[var(--line)] p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--surface-strong)]"
                      >
                        <ChevronDownIcon open={isOpen} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded mappings */}
                  {isOpen && (
                    <div className="border-t border-[var(--line)] bg-[var(--surface-strong)] px-5 py-4 space-y-3">
                      {uni.moduleMappings.map((mapping) => (
                        <div key={`${uni.partnerUniversityId}-${mapping.nusModuleCode}`} className="flex items-start gap-3">
                          {confidenceIcon(mapping.classification, mapping.confidence)}
                          <div className="min-w-0 flex-1 text-xs">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="font-semibold text-[var(--foreground)]">{mapping.nusModuleCode}</span>
                              <span className="text-[var(--muted-foreground)]">→</span>
                              <span className="font-medium text-[var(--foreground)]">{mapping.courseCode}</span>
                              <span className="text-[var(--muted-foreground)]">{mapping.title}</span>
                              <span className="rounded bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--foreground)]">
                                {Math.round(mapping.confidence * 100)}%
                              </span>
                            </div>
                            {mapping.explanation && (
                              <p className="mt-0.5 text-[var(--muted-foreground)] line-clamp-1">{mapping.explanation}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {uni.unmappedModules.length > 0 && (
                        <div className="flex items-center gap-3">
                          <UnmappedIcon />
                          <p className="text-xs text-[var(--muted-foreground)]">
                            No mapping found for: {uni.unmappedModules.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  // ── Loading view ─────────────────────────────────────────────────────────────
  if (viewMode === "loading") {
    return (
      <section className="mx-auto max-w-4xl py-10">
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="font-semibold text-[var(--foreground)]">Finding matches…</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Checking historical mappings for {modules.map((m) => m.code).join(", ")}
          </p>
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--muted)]"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Plan view (default) ───────────────────────────────────────────────────────
  return (
    <section className="mx-auto max-w-4xl py-10">
      {/* Heading */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold text-[var(--foreground)] md:text-5xl">
          Module Planner
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)] md:text-base">
          Enter your NUS module codes below. We&apos;ll show which partner universities can fulfil them.
        </p>
      </div>

      {/* Input card */}
      <div className="glass-panel mt-8 rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
          NUS modules to fulfil
        </p>

        <div className="mt-4 flex gap-3">
          <label className="flex h-10 flex-1 items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4">
            <SearchIcon />
            <input
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAdd();
                }
              }}
              disabled={validating}
              className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] disabled:opacity-50"
              placeholder="e.g. CS2040, BT3102, IS3103…"
            />
          </label>

          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={validating || entry.trim() === ""}
            className="flex h-10 items-center gap-2 rounded-xl bg-[var(--foreground)] px-4 text-sm font-medium text-white disabled:opacity-50"
          >
            {validating ? (
              <span>Checking…</span>
            ) : (
              <>
                <PlusIcon />
                Add
              </>
            )}
          </button>
        </div>

        {errors.length > 0 && (
          <div className="mt-3 space-y-1">
            {errors.map((err) => (
              <p key={err} className="text-xs text-red-500">{err}</p>
            ))}
          </div>
        )}

        {apiError && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            <p className="font-medium">{apiError.error}</p>
            {apiError.readiness?.guidance?.map((g) => <p key={g}>{g}</p>)}
          </div>
        )}

        {/* Semester selector */}
        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <span>Semester</span>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="rounded-lg border border-[var(--line)] bg-transparent px-3 py-1 text-sm text-[var(--foreground)] outline-none"
          >
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
          </select>
        </div>

        {/* Module chips */}
        {modules.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {modules.map((mod) => (
              <button
                key={mod.code}
                type="button"
                onClick={() => setModules((prev) => prev.filter((m) => m.code !== mod.code))}
                className="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-1 text-xs hover:border-red-300 hover:bg-red-50"
              >
                <span className="font-semibold text-[var(--foreground)]">{mod.code}</span>
                <span className="max-w-[120px] truncate text-[var(--muted-foreground)]">{mod.title}</span>
                <span className="text-[var(--muted-foreground)]">×</span>
              </button>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          {modules.length === 0
            ? "No modules added yet."
            : `${modules.length} module${modules.length === 1 ? "" : "s"} added.`}
        </p>
      </div>

      {/* CTA */}
      {modules.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => void handleShowMatches()}
            className="rounded-xl bg-[var(--foreground)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Show matches →
          </button>
        </div>
      )}

      {modules.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <svg aria-hidden="true" className="h-10 w-10 text-[var(--muted)]" fill="none" viewBox="0 0 24 24">
            <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
          </svg>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--foreground)]">
            Add your NUS modules above
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            We&apos;ll match them to partner university equivalents.
          </p>
        </div>
      )}
    </section>
  );
}
