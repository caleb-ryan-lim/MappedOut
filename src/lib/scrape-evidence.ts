import { promises as fs } from "node:fs";
import path from "node:path";

export async function saveScrapeEvidence(universitySlug: string, courseSlug: string, markdown: string) {
  const directory = path.join(process.cwd(), "data", "scrape-evidence", universitySlug);
  await fs.mkdir(directory, { recursive: true });
  const filePath = path.join(directory, `${courseSlug}.md`);
  await fs.writeFile(filePath, markdown, "utf8");
  return filePath;
}
