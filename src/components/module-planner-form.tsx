"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-7 w-7 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path d="M12 5V19" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M5 12H19" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg aria-hidden="true" className="h-16 w-16 text-[rgba(31,43,60,0.24)]" fill="none" viewBox="0 0 24 24">
      <path
        d="M4.75 5.75C4.75 4.7835 5.5335 4 6.5 4H10.25C11.6307 4 12.75 5.11929 12.75 6.5V19.25H7.25C5.86929 19.25 4.75 18.1307 4.75 16.75V5.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.25 5.75C19.25 4.7835 18.4665 4 17.5 4H13.75C12.3693 4 11.25 5.11929 11.25 6.5V19.25H16.75C18.1307 19.25 19.25 18.1307 19.25 16.75V5.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function normalizeEntries(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean);
}

export function ModulePlannerForm() {
  const router = useRouter();
  const [entry, setEntry] = useState("");
  const [semester, setSemester] = useState("Semester 1");
  const [modules, setModules] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const moduleValue = useMemo(() => modules.join(","), [modules]);

  function handleAdd() {
    const next = normalizeEntries(entry);
    if (next.length === 0) {
      return;
    }

    setModules((current) => [...new Set([...current, ...next])]);
    setEntry("");
  }

  function handleSubmit() {
    if (modules.length === 0) {
      return;
    }

    startTransition(() => {
      const params = new URLSearchParams({
        modules: moduleValue,
        semester,
        overseasOnly: "true",
      });
      router.push(`/results?${params.toString()}`);
    });
  }

  return (
    <section className="mx-auto max-w-6xl pt-10 md:pt-16">
      <div className="max-w-5xl">
        <h1 className="font-[family-name:var(--font-display)] text-6xl leading-none tracking-[-0.04em] text-[var(--foreground)] md:text-[5.5rem]">
          Module Planner
        </h1>
        <p className="mt-7 text-[2rem] leading-relaxed text-[var(--muted-foreground)]">
          Enter the NUS module codes you need to read while on exchange. We&apos;ll show which partner universities offer the closest equivalents.
        </p>
      </div>

      <div className="glass-panel mt-16 rounded-[2rem] px-8 py-8 md:px-10">
        <p className="text-[1.05rem] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)]">
          NUS Modules To Fulfil
        </p>

        <div className="mt-6 flex flex-col gap-4 xl:flex-row">
          <label className="flex h-20 flex-1 items-center gap-4 rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-strong)] px-6">
            <SearchIcon />
            <input
              value={entry}
              onChange={(event) => setEntry(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAdd();
                }
              }}
              className="w-full bg-transparent text-[2rem] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
              placeholder="e.g. CS2040, BT3102, IS3103..."
            />
          </label>

          <button
            type="button"
            onClick={handleAdd}
            className="flex h-20 min-w-48 items-center justify-center gap-3 rounded-[1.5rem] bg-[var(--foreground)] px-8 text-[2rem] font-medium text-white"
          >
            <PlusIcon />
            Add
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-lg text-[var(--muted-foreground)]">
          <span>Semester</span>
          <select
            value={semester}
            onChange={(event) => setSemester(event.target.value)}
            className="rounded-full border border-[var(--line)] bg-transparent px-4 py-2 text-[var(--foreground)] outline-none"
          >
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
          </select>
        </div>

        {modules.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {modules.map((module) => (
              <button
                key={module}
                type="button"
                onClick={() => setModules((current) => current.filter((item) => item !== module))}
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-lg text-[var(--foreground)]"
              >
                {module}
              </button>
            ))}
          </div>
        ) : null}

        <p className="mt-6 text-lg text-[var(--muted-foreground)]">
          {modules.length === 0
            ? "No modules added yet."
            : `${modules.length} module${modules.length === 1 ? "" : "s"} added.`}
        </p>
      </div>

      <div className="flex flex-col items-center pb-12 pt-24 text-center">
        <BookIcon />
        {modules.length === 0 ? (
          <>
            <h2 className="mt-8 font-[family-name:var(--font-display)] text-5xl text-[var(--foreground)]">
              Add NUS module codes above
            </h2>
            <p className="mt-5 text-[2rem] text-[var(--muted-foreground)]">
              We&apos;ll match them to partner university equivalents.
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-8 font-[family-name:var(--font-display)] text-5xl text-[var(--foreground)]">
              Ready to view ranked matches
            </h2>
            <p className="mt-5 text-[2rem] text-[var(--muted-foreground)]">
              Review partner universities for your selected modules.
            </p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="mt-8 rounded-full bg-[var(--foreground)] px-8 py-4 text-xl text-white disabled:opacity-60"
            >
              {isPending ? "Loading..." : "Show matches"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
