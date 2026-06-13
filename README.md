# MappedOut

MappedOut is an MVP web app for NUS Computing students who want to shortlist overseas exchange universities based on likely module mappings. It combines three evidence layers:

- historical SoC SEP Excel mappings
- current NUS partner-university context
- current partner course-catalogue scraping via Bright Data

This tool provides mapping recommendations only. Final approval is determined by NUS and the relevant course hosts. Historical mappings are indicative and may not carry over to future semesters. Course availability, workload, grading mode, and content may change.

## Stack

- Next.js 16 + TypeScript
- Prisma + PostgreSQL
- Tailwind CSS
- Vitest
- Bright Data JavaScript SDK (`@brightdata/sdk`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env values:

```bash
cp .env.example .env
```

3. Set:

- `DATABASE_URL`
- `BRIGHT_DATA_API_KEY`
- `BRIGHT_DATA_ZONE`

4. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

For production or Vercel-hosted environments, apply migrations with:

```bash
npx prisma migrate deploy
```

5. Start the app:

```bash
npm run dev
```

## Bright Data Setup

MappedOut uses the official Bright Data JavaScript SDK and routes scraping through:

- `brightDataSearch()` for search-driven discovery of official partner catalogue pages
- `brightDataScrapeMarkdown()` for markdown snapshots of course pages

The integration lives in [src/lib/bright-data.ts](C:/Users/caleb/OneDrive/Documents/MappedOut/src/lib/bright-data.ts) and is used by [src/lib/partner-scraping.ts](C:/Users/caleb/OneDrive/Documents/MappedOut/src/lib/partner-scraping.ts).

## Historical Excel Import

Use the admin page to upload:

- `SoC SEP mapping list excel.xlsx`
- or a `.csv` export with the same headers

The importer:

- validates required columns
- preserves original row JSON
- stores source sheet and row number
- keeps blank `Pre Approved?` as `UNKNOWN`
- supports combined `PU Course 1` + `PU Course 2` rows
- records warnings instead of crashing on partial rows

## Data Flow

1. Import historical mappings from the SoC workbook.
2. Refresh NUS partner universities from NUS public pages.
3. Use Bright Data search to discover likely official catalogue URLs.
4. Use Bright Data scrape to cache markdown evidence from those URLs.
5. Fetch current NUS module metadata from NUSMods.
6. Rank universities with a transparent scoring engine.

## Scoring

`finalScore = 0.35 * content + 0.20 * workload + 0.10 * level + 0.10 * prerequisites + 0.20 * historical + 0.05 * availability - restrictionPenalty`

Classifications:

- `strong` for scores `>= 0.80`
- `possible` for scores `>= 0.65`
- `weak` for scores `>= 0.50`
- `notRecommended` below `0.50`

## API Surface

- `POST /api/import/historical-mappings`
- `POST /api/scrape/nus-partners`
- `POST /api/scrape/partner-courses`
- `POST /api/map`
- `GET /api/partners`
- `GET /api/partners/:id/courses`
- `GET /api/modules/:code`
- `GET /api/admin/imports`
- `GET /api/admin/scrape-jobs`
- `GET /api/admin/status`

## Tests

Run:

```bash
npm test
```

Current coverage focuses on:

- historical import header validation
- pre-approval normalization
- parsing markdown catalogue fixtures
- credit normalization
- score classification

## Limitations

- The NUS partner scraper currently uses public-page heuristics and should be refined against the real page structure.
- Partner-catalogue parsing is intentionally conservative for the MVP and works best on clean markdown snapshots.
- Production use needs a real PostgreSQL database plus a real historical workbook import before ranking results will be meaningful.
