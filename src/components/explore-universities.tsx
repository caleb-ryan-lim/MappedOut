"use client";

import { useMemo, useState } from "react";

type UniversityCardData = {
  id: string;
  name: string;
  country: string;
  city: string;
  rankLabel: string;
  image: string;
};

const UNIVERSITIES: UniversityCardData[] = [
  {
    id: "nus",
    name: "National University of Singapore",
    country: "Singapore",
    city: "Singapore, Singapore",
    rankLabel: "#8 Global",
    image: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "eth-zurich",
    name: "ETH Zurich",
    country: "Switzerland",
    city: "Zurich, Switzerland",
    rankLabel: "#7 Global",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "melbourne",
    name: "University of Melbourne",
    country: "Australia",
    city: "Melbourne, Australia",
    rankLabel: "#33 Global",
    image: "https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "toronto",
    name: "University of Toronto",
    country: "Canada",
    city: "Toronto, Canada",
    rankLabel: "#21 Global",
    image: "https://images.unsplash.com/photo-1470219556762-1771e7f9427d?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "ucl",
    name: "University College London",
    country: "United Kingdom",
    city: "London, United Kingdom",
    rankLabel: "#9 Global",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "tokyo",
    name: "University of Tokyo",
    country: "Japan",
    city: "Tokyo, Japan",
    rankLabel: "#28 Global",
    image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1400&q=80",
  },
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

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return UNIVERSITIES;
    }

    return UNIVERSITIES.filter((university) =>
      [university.name, university.country, university.city].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [query]);

  return (
    <section className="mt-14">
      <div className="mx-auto flex max-w-6xl gap-4">
        <label className="glass-panel flex h-24 flex-1 items-center gap-5 rounded-[2rem] px-8">
          <SearchIcon />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-2xl text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
            placeholder="Search by university, country, or module..."
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
            Top Partner Universities
          </h2>
          <p className="text-2xl text-[var(--muted-foreground)]">{filtered.length} universities</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {filtered.map((university) => (
            <article
              key={university.id}
              className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white shadow-[0_6px_18px_rgba(46,39,31,0.05)]"
            >
              <div className="relative h-[22rem] bg-[var(--surface-strong)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={university.name} className="h-full w-full object-cover" src={university.image} />
                <div className="absolute bottom-4 left-4 rounded-full bg-[var(--foreground)] px-4 py-2 text-xl text-white">
                  {university.rankLabel}
                </div>
              </div>
              <div className="space-y-3 px-6 py-6">
                <h3 className="text-[2.35rem] font-medium leading-tight text-[var(--foreground)]">
                  {university.name}
                </h3>
                <p className="text-xl text-[var(--muted-foreground)]">{university.city}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
