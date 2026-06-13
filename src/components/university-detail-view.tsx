"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type NusModule = {
  code: string;
  title: string;
  description: string | null;
  units: number | null;
  semesters: string | null;
};

type ProfileData = {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  officialExchangeUrl: string | null;
  heroImageUrl: string | null;
  language: string;
  exchangeSpots: number | null;
  applicationDeadline: string | null;
  about: string | null;
  areasOfStudy: string[];
  totalOverseasCourses: number;
  nusModules: NusModule[];
};

type UniversityDetailViewProps = {
  partnerUniversityId: string;
  request: {
    nusModuleCodes: string[];
    targetSemester?: string;
    preferredCountries?: string[];
    overseasOnly?: boolean;
  };
};

const MODULE_CHIP_COLORS: Record<string, string> = {
  CS: "bg-teal-700 text-white",
  IS: "bg-blue-700 text-white",
  BT: "bg-blue-500 text-white",
  MKT: "bg-orange-500 text-white",
  DSA: "bg-purple-600 text-white",
  MA: "bg-green-700 text-white",
  ST: "bg-green-600 text-white",
  PH: "bg-red-500 text-white",
  EC: "bg-yellow-600 text-white",
  CG: "bg-indigo-600 text-white",
  EE: "bg-cyan-700 text-white",
  ME: "bg-slate-600 text-white",
};

function chipColor(code: string) {
  const prefix = code.match(/^[A-Z]+/)?.[0] ?? "";
  return MODULE_CHIP_COLORS[prefix] ?? "bg-stone-700 text-white";
}

function MapPinIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
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

function GlobeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3C12 3 9 7 9 12C9 17 12 21 12 21M12 3C12 3 15 7 15 12C15 17 12 21 12 21M3 12H21" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 20C2 17.2386 4.68629 15 8 15C9.16476 15 10.2549 15.2934 11.2 15.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      <circle cx="16" cy="11" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 21C10 18.2386 12.6863 16 16 16C19.3137 16 22 18.2386 22 21" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9H21M8 2V6M16 2V6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

export function UniversityDetailView({
  partnerUniversityId,
  request,
}: UniversityDetailViewProps) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const backQuery = new URLSearchParams({
    modules: request.nusModuleCodes.join(","),
    semester: request.targetSemester ?? "",
    countries: request.preferredCountries?.join(",") ?? "",
    overseasOnly: String(request.overseasOnly ?? true),
  }).toString();

  useEffect(() => {
    const controller = new AbortController();
    const modulesParam = encodeURIComponent(request.nusModuleCodes.join(","));
    const url = `/api/universities/${partnerUniversityId}/profile?modules=${modulesParam}`;

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.error ?? "Unable to load university profile.");
        }
        return res.json() as Promise<ProfileData>;
      })
      .then(setData)
      .catch((err: Error) => {
        if (err.name !== "AbortError") setError(err.message);
      });

    return () => controller.abort();
  }, [partnerUniversityId, request.nusModuleCodes]);

  if (error) {
    return (
      <div className="glass-panel rounded-2xl p-8">
        <p className="font-semibold">Something went wrong.</p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{error}</p>
        <Link
          href={`/results?${backQuery}`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm"
        >
          <ArrowLeftIcon />
          Back to results
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel rounded-2xl p-8">
        <p className="font-semibold">Loading university profile…</p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Fetching exchange information and available modules.
        </p>
      </div>
    );
  }

  const location =
    [data.region, data.country].filter(Boolean).join(", ") || data.country || "Location unknown";
  const showHero = Boolean(data.heroImageUrl) && !imgFailed;

  return (
    <div className="space-y-5">
      {/* Back button */}
      <Link
        href={`/results?${backQuery}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface-strong)]"
      >
        <ArrowLeftIcon />
        Back to search
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl">
        {showHero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.heroImageUrl!}
            alt={data.name}
            className="h-56 w-full object-cover md:h-72"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="h-56 w-full bg-[radial-gradient(circle_at_top,_rgba(201,220,230,0.6),_transparent_60%),linear-gradient(180deg,_#ede6de,_#e7dccf)] md:h-72" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5">
          <div className="flex items-center gap-1.5 text-white/80">
            <MapPinIcon />
            <span className="text-sm">{location}</span>
          </div>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-white md:text-4xl">
            {data.name}
          </h1>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<GlobeIcon />} label="Language" value={data.language} />
        <StatCard
          icon={<UsersIcon />}
          label="Exchange Spots"
          value={data.exchangeSpots ? `${data.exchangeSpots} students` : "—"}
        />
        <StatCard icon={<CalendarIcon />} label="Deadline" value={data.applicationDeadline ?? "—"} />
        <StatCard
          icon={<BookOpenIcon />}
          label="Modules Available"
          value={
            data.nusModules.length > 0
              ? `${data.nusModules.length} module${data.nusModules.length !== 1 ? "s" : ""}`
              : data.totalOverseasCourses > 0
              ? `${data.totalOverseasCourses} courses`
              : "—"
          }
        />
      </div>

      {/* About (1/3) + Modules (2/3) */}
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        {/* About */}
        <div className="glass-panel space-y-4 rounded-2xl p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--foreground)]">
            About
          </h2>
          <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
            {data.about ??
              `${data.name} is a partner university in the NUS Student Exchange Programme. Visit the official page for the latest intake information.`}
          </p>

          {data.areasOfStudy.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Areas of Study
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.areasOfStudy.map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-2.5 py-0.5 text-xs text-[var(--ink-soft)]"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.officialExchangeUrl && (
            <a
              href={data.officialExchangeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-sm text-[var(--foreground)] underline underline-offset-4 hover:opacity-70"
            >
              Visit exchange page →
            </a>
          )}
        </div>

        {/* Available Modules */}
        <div className="glass-panel space-y-4 rounded-2xl p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--foreground)]">
            Available Modules
          </h2>
          {data.nusModules.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">
              No modules submitted. Go back to the planner and enter your NUS module codes to see matches here.
            </p>
          ) : (
            <div className="space-y-2.5">
              {data.nusModules.map((mod) => (
                <div
                  key={mod.code}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${chipColor(mod.code)}`}>
                        {mod.code}
                      </span>
                      <span className="min-w-0 text-sm font-medium leading-snug text-[var(--foreground)]">
                        {mod.title}
                      </span>
                    </div>
                    <div className="shrink-0 text-right text-xs text-[var(--ink-soft)]">
                      {mod.semesters && <p>{mod.semesters}</p>}
                      {mod.units != null && <p>{mod.units} MCs</p>}
                    </div>
                  </div>
                  {mod.description && (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[var(--ink-soft)]">
                      {mod.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
