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
  CS: "bg-teal-800 text-white",
  IS: "bg-blue-700 text-white",
  BT: "bg-blue-500 text-white",
  MKT: "bg-orange-500 text-white",
  DSA: "bg-purple-600 text-white",
  MA: "bg-green-700 text-white",
  ST: "bg-green-500 text-white",
  PH: "bg-red-500 text-white",
  EC: "bg-yellow-600 text-black",
  CG: "bg-indigo-600 text-white",
  EE: "bg-cyan-700 text-white",
  ME: "bg-slate-600 text-white",
};

function chipColor(code: string) {
  const prefix = code.match(/^[A-Z]+/)?.[0] ?? "";
  return MODULE_CHIP_COLORS[prefix] ?? "bg-stone-700 text-white";
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
      <div className="glass-panel rounded-[2rem] p-8">
        <p className="text-lg font-semibold">Something went wrong.</p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{error}</p>
        <Link
          href={`/results?${backQuery}`}
          className="mt-4 inline-block rounded-full border border-[var(--line)] px-4 py-2 text-sm"
        >
          ← Back to results
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel rounded-[2rem] p-8">
        <p className="text-lg font-semibold">Loading university profile...</p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Fetching exchange information and available modules.
        </p>
      </div>
    );
  }

  const location =
    [data.region, data.country].filter(Boolean).join(", ") ||
    data.country ||
    "Location unknown";

  const showHero = Boolean(data.heroImageUrl) && !imgFailed;

  return (
    <div className="space-y-5">
      {/* Back button */}
      <Link
        href={`/results?${backQuery}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2 text-sm"
      >
        ← Back to search
      </Link>

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-[2rem]">
        {showHero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.heroImageUrl!}
            alt={data.name}
            className="h-64 w-full object-cover md:h-80"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="h-64 w-full bg-[radial-gradient(circle_at_top,_rgba(255,213,163,0.44),_transparent_60%),linear-gradient(180deg,_rgba(194,116,62,0.22),_rgba(232,220,204,0.9))] md:h-80" />
        )}
        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <p className="text-sm text-white/75">📍 {location}</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl leading-tight text-white md:text-5xl">
            {data.name}
          </h1>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon="🌐" label="Language" value={data.language} />
        <StatCard
          icon="👥"
          label="Exchange Spots"
          value={data.exchangeSpots ? `${data.exchangeSpots} students` : "—"}
        />
        <StatCard
          icon="📅"
          label="Deadline"
          value={data.applicationDeadline ?? "—"}
        />
        <StatCard
          icon="📖"
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

      {/* About + Modules */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* About */}
        <div className="glass-panel rounded-[2rem] p-6 space-y-4">
          <h2 className="font-semibold">About</h2>
          <p className="text-sm leading-7 text-[var(--ink-soft)]">
            {data.about ??
              `${data.name} is a partner university in the NUS Student Exchange Programme. Visit the official page for the latest intake information.`}
          </p>

          {data.areasOfStudy.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Areas of Study</p>
              <div className="flex flex-wrap gap-2">
                {data.areasOfStudy.map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-1 text-xs text-[var(--ink-soft)]"
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
              className="inline-block text-sm text-[var(--accent)] underline-offset-4 hover:underline"
            >
              View exchange programme page →
            </a>
          )}
        </div>

        {/* Available Modules */}
        <div className="glass-panel rounded-[2rem] p-6 space-y-4">
          <h2 className="font-semibold">Available Modules</h2>
          {data.nusModules.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">
              No planned modules were submitted. Go back to the planner and enter your NUS module codes to see matches here.
            </p>
          ) : (
            <div className="space-y-3">
              {data.nusModules.map((mod) => (
                <div
                  key={mod.code}
                  className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-strong)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span
                        className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold ${chipColor(mod.code)}`}
                      >
                        {mod.code}
                      </span>
                      <span className="min-w-0 text-sm font-semibold leading-snug">
                        {mod.title}
                      </span>
                    </div>
                    <div className="shrink-0 text-right text-xs text-[var(--ink-soft)]">
                      {mod.semesters && <p>{mod.semesters}</p>}
                      {mod.units != null && <p>{mod.units} MCs</p>}
                    </div>
                  </div>
                  {mod.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--ink-soft)]">
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
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-panel rounded-[1.5rem] p-4">
      <div className="flex items-center gap-2 text-[var(--ink-soft)]">
        <span className="text-base">{icon}</span>
        <p className="text-xs">{label}</p>
      </div>
      <p className="mt-2 font-semibold text-sm">{value}</p>
    </div>
  );
}
