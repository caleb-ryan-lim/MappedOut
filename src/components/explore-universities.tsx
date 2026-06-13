"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PartnerUniversity = {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
};

// Cycling campus images keyed by position
const CAMPUS_IMAGES = [
  "https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1470219556762-1771e7f9427d?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1400&q=80",
];

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-7 w-7 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg aria-hidden="true" className="h-7 w-7 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24">
      <path d="M4 7H20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M4 12H20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M4 17H20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="9" cy="7" fill="var(--background)" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="15" cy="12" fill="var(--background)" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="11" cy="17" fill="var(--background)" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function ExploreUniversities() {
  const [query, setQuery] = useState("");
  const [universities, setUniversities] = useState<PartnerUniversity[] | null>(null);

  useEffect(() => {
    fetch("/api/partners")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { partners: PartnerUniversity[] }) =>
        setUniversities(data.partners ?? []),
      )
      .catch(() => setUniversities([]));
  }, []);

  const filtered = useMemo(() => {
    if (!universities) return null;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return universities;
    return universities.filter((u) =>
      [u.name, u.country, u.region].some((v) =>
        v?.toLowerCase().includes(normalized),
      ),
    );
  }, [query, universities]);

  return (
    <section className="mt-14">
      <div className="mx-auto flex max-w-6xl gap-4">
        <label className="glass-panel flex h-24 flex-1 items-center gap-5 rounded-[2rem] px-8">
          <SearchIcon />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-2xl text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
            placeholder="Search by university, country, or region..."
          />
        </label>
        <button
          type="button"
          className="glass-panel flex h-24 min-w-56 items-center justify-center gap-4 rounded-[2rem] px-8 text-2xl text-[var(--foreground)]"
        >
          <FilterIcon />
          <span>Filter</span>
        </button>
      </div>

      <div className="section-rule mt-16 pt-7">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-5xl leading-none text-[var(--foreground)]">
            Partner Universities
          </h2>
          {filtered !== null && (
            <p className="text-2xl text-[var(--muted-foreground)]">
              {filtered.length} {filtered.length === 1 ? "university" : "universities"}
            </p>
          )}
        </div>

        {/* Loading skeletons */}
        {filtered === null && (
          <div className="grid gap-8 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[30rem] animate-pulse rounded-[2rem] bg-[var(--surface-strong)]"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {filtered !== null && filtered.length === 0 && (
          <p className="mt-4 text-xl text-[var(--muted-foreground)]">
            {universities?.length === 0
              ? "No partner universities have been imported yet. Complete the backend setup to populate this list."
              : "No universities match your search."}
          </p>
        )}

        {/* Cards */}
        {filtered !== null && filtered.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-3">
            {filtered.map((university, index) => (
              <Link
                key={university.id}
                href={`/universities/${university.id}`}
                className="block"
              >
                <article className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white shadow-[0_6px_18px_rgba(46,39,31,0.05)] transition-transform hover:-translate-y-1">
                  <div className="relative h-[22rem] bg-[var(--surface-strong)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={university.name}
                      className="h-full w-full object-cover"
                      src={CAMPUS_IMAGES[index % CAMPUS_IMAGES.length]}
                    />
                    {university.country && (
                      <div className="absolute bottom-4 left-4 rounded-full bg-[var(--foreground)] px-4 py-2 text-xl text-white">
                        {university.country}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 px-6 py-6">
                    <h3 className="text-[2.35rem] font-medium leading-tight text-[var(--foreground)]">
                      {university.name}
                    </h3>
                    <p className="text-xl text-[var(--muted-foreground)]">
                      {[university.region, university.country].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
