"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ModulePlannerForm() {
  const router = useRouter();
  const [modules, setModules] = useState("CS2100\nCS2103T\nCS3244\nCS3245\nIS3107\nBT3103");
  const [semester, setSemester] = useState("AY2026/2027 Semester 1");
  const [countries, setCountries] = useState("");
  const [minimumClassification, setMinimumClassification] = useState("possible");
  const [overseasOnly, setOverseasOnly] = useState(true);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(() => {
      const params = new URLSearchParams({
        modules: String(formData.get("modules") ?? ""),
        semester: String(formData.get("semester") ?? ""),
        countries: String(formData.get("countries") ?? ""),
        minimumClassification: String(formData.get("minimumClassification") ?? "possible"),
        overseasOnly: String(formData.get("overseasOnly") === "on"),
      });
      router.push(`/results?${params.toString()}`);
    });
  }

  return (
    <form action={handleSubmit} className="glass-panel space-y-6 rounded-[2rem] p-6 md:p-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
          University exchange planner
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-5xl leading-none tracking-tight md:text-7xl">
          Find your perfect exchange university
        </h1>
        <p className="max-w-2xl text-sm leading-8 text-[var(--ink-soft)] md:text-base">
          Enter the NUS modules you want to clear on exchange. MappedOut combines historical SoC mappings,
          NUS partner data, and Bright Data course catalogue scraping to rank likely matches.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-[1.35fr_1fr]">
        <label className="space-y-2">
          <span className="text-sm font-medium">NUS module codes</span>
          <textarea
            name="modules"
            rows={8}
            value={modules}
            onChange={(event) => setModules(event.target.value)}
            className="min-h-56 w-full rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-4 outline-none"
          />
        </label>

        <div className="space-y-5">
          <label className="space-y-2">
            <span className="text-sm font-medium">Target semester</span>
            <input
              name="semester"
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
              className="w-full rounded-[1.2rem] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Preferred countries</span>
            <input
              name="countries"
              value={countries}
              onChange={(event) => setCountries(event.target.value)}
              placeholder="Canada, Sweden, Japan"
              className="w-full rounded-[1.2rem] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Minimum classification</span>
            <select
              name="minimumClassification"
              value={minimumClassification}
              onChange={(event) => setMinimumClassification(event.target.value)}
              className="w-full rounded-[1.2rem] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 outline-none"
            >
              <option value="strong">Strong only</option>
              <option value="possible">Possible and above</option>
              <option value="weak">Weak and above</option>
            </select>
          </label>

          <label className="flex items-center gap-3 rounded-[1.2rem] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3">
            <input
              name="overseasOnly"
              type="checkbox"
              checked={overseasOnly}
              onChange={(event) => setOverseasOnly(event.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm">Overseas universities only</span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Ranking universities..." : "Find best-fit universities"}
        </button>
        <p className="max-w-xl text-xs leading-6 text-[var(--ink-soft)]">
          This tool provides mapping recommendations only. Final approval is determined by NUS and the relevant
          course hosts. Historical mappings are indicative and may not carry over to future semesters. Course
          availability, workload, grading mode, and content may change.
        </p>
      </div>
    </form>
  );
}
