import { ResultsDashboard } from "@/components/results-dashboard";
import { normalizeModuleCode } from "@/lib/normalize";

type ResultsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const modules = String(params.modules ?? "")
    .split(/\r?\n|,/)
    .map(normalizeModuleCode)
    .filter(Boolean);
  const countries = String(params.countries ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return (
    <main className="display-grid min-h-screen px-5 py-8 md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <ResultsDashboard
          request={{
            nusModuleCodes: modules,
            targetSemester: String(params.semester ?? ""),
            preferredCountries: countries,
            overseasOnly: String(params.overseasOnly ?? "true") !== "false",
          }}
        />
      </div>
    </main>
  );
}
