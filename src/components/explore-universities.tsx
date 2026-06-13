"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type PartnerUniversity = {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  _count: { overseasCourses: number };
};

const CAMPUS_IMAGES = [
  "https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1470219556762-1771e7f9427d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80",
];

const REGIONS = ["Asia Pacific", "Europe", "Americas", "Oceania", "Middle East & Africa"];

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="8" cy="6" fill="var(--surface)" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="12" fill="var(--surface)" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="18" fill="var(--surface)" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24">
      <path d="M5 12H19M13 6L19 12L13 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24">
      <path d="M5 12L10 17L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
    </svg>
  );
}

export function ExploreUniversities() {
  const [query, setQuery] = useState("");
  const [universities, setUniversities] = useState<PartnerUniversity[] | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/partners")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { partners: PartnerUniversity[] }) =>
        setUniversities(data.partners ?? []),
      )
      .catch(() => setUniversities([]));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!universities) return null;
    const normalized = query.trim().toLowerCase();
    let result = universities;
    if (normalized) {
      result = result.filter((u) =>
        [u.name, u.country, u.region].some((v) =>
          v?.toLowerCase().includes(normalized),
        ),
      );
    }
    if (selectedRegions.size > 0) {
      result = result.filter((u) => u.region && selectedRegions.has(u.region));
    }
    return result;
  }, [query, universities, selectedRegions]);

  function toggleRegion(region: string) {
    setSelectedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  }

  const activeFilterCount = selectedRegions.size;

  return (
    <section className="mt-10">
      {/* Search + Filter row */}
      <div className="flex gap-3">
        <label className="flex h-11 flex-1 items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 shadow-sm">
          <SearchIcon className="h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
            placeholder="Search by university, country, or region…"
          />
        </label>

        <div ref={filterRef} className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="flex h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-sm text-[var(--foreground)] shadow-sm hover:bg-[var(--surface-strong)]"
          >
            <SlidersIcon />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--foreground)] text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-13 z-50 w-72 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--foreground)]">Region</p>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedRegions(new Set())}
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {REGIONS.map((region) => {
                  const active = selectedRegions.has(region);
                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleRegion(region)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                        active
                          ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                          : "border-[var(--line)] text-[var(--muted-foreground)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {active && <CheckIcon />}
                      {region}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Heading row */}
      <div className="mt-8 flex items-baseline justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--foreground)]">
          Top Partner Universities
        </h2>
        {filtered !== null && (
          <p className="text-sm text-[var(--muted-foreground)]">
            {filtered.length} {filtered.length === 1 ? "university" : "universities"}
          </p>
        )}
      </div>

      {/* Loading skeletons */}
      {filtered === null && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-[var(--surface-strong)]" style={{ height: 280 }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {filtered !== null && filtered.length === 0 && (
        <p className="mt-6 text-sm text-[var(--muted-foreground)]">
          {universities?.length === 0
            ? "No partner universities imported yet. Complete the backend setup to populate this list."
            : "No universities match your search or filters."}
        </p>
      )}

      {/* Cards */}
      {filtered !== null && filtered.length > 0 && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((university, index) => (
            <Link
              key={university.id}
              href={`/universities/${university.id}`}
              className="group block"
            >
              <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                {/* Image */}
                <div className="relative h-44 bg-[var(--surface-strong)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={university.name}
                    className="h-full w-full object-cover"
                    src={CAMPUS_IMAGES[index % CAMPUS_IMAGES.length]}
                  />
                  {/* Bottom gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                  {/* Ranking badge */}
                  <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                    #{index + 1}
                  </div>
                  {/* Location on image */}
                  {(university.country || university.region) && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white/90">
                      <MapPinIcon />
                      <span className="text-xs">
                        {[university.country, university.region].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="px-4 pb-4 pt-3">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--foreground)]">
                    {university.name}
                  </h3>

                  {/* Metadata row */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                      <BookOpenIcon />
                      <span>
                        {university._count.overseasCourses > 0
                          ? `${university._count.overseasCourses} courses`
                          : "NUS Partner"}
                      </span>
                    </div>
                    <span className="text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--foreground)]">
                      <ArrowRightIcon />
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
