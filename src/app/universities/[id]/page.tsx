import { UniversityDetailView } from "@/components/university-detail-view";
import { normalizeModuleCode } from "@/lib/normalize";

type UniversityPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UniversityPage({
  params,
  searchParams,
}: UniversityPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const modules = String(query.modules ?? "")
    .split(/\r?\n|,/)
    .map(normalizeModuleCode)
    .filter(Boolean);
  const countries = String(query.countries ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return (
    <main className="display-grid min-h-screen px-5 py-8 md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <UniversityDetailView
          partnerUniversityId={id}
          request={{
            nusModuleCodes: modules,
            targetSemester: String(query.semester ?? ""),
            preferredCountries: countries,
            minimumClassification: String(query.minimumClassification ?? "possible"),
            overseasOnly: String(query.overseasOnly ?? "true") !== "false",
          }}
        />
      </div>
    </main>
  );
}
