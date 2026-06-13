const FEATURED_UNIVERSITIES = [
  {
    name: "University of California, Los Angeles",
    country: "United States",
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "University of Melbourne",
    country: "Australia",
    image:
      "https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "University of Toronto",
    country: "Canada",
    image:
      "https://images.unsplash.com/photo-1470219556762-1771e7f9427d?auto=format&fit=crop&w=1200&q=80",
  },
];

export function FeaturedUniversities() {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
            Featured partners
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl leading-none text-[var(--foreground)] md:text-5xl">
            Explore the style and destinations from the reference design.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-[var(--ink-soft)]">
          The frontend now follows the warm editorial Figma direction while keeping the scoring, warnings, and evidence model from the SEP planning spec.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {FEATURED_UNIVERSITIES.map((university) => (
          <article
            key={university.name}
            className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_24px_50px_rgba(94,63,37,0.08)]"
          >
            <div className="h-52 overflow-hidden bg-[var(--surface-strong)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={university.name}
                className="h-full w-full object-cover"
                src={university.image}
              />
            </div>
            <div className="space-y-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                {university.country}
              </p>
              <h3 className="font-[family-name:var(--font-display)] text-3xl leading-none text-[var(--foreground)]">
                {university.name}
              </h3>
              <p className="text-sm leading-7 text-[var(--ink-soft)]">
                Representative partner card styling from the visual direction you shared.
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
