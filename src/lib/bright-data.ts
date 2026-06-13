import { bdclient } from "@brightdata/sdk";
import { env, hasBrightData } from "@/lib/env";
import { normalizeWhitespace } from "@/lib/normalize";

let brightData: bdclient | null = null;

function getClient() {
  if (!hasBrightData || !env.BRIGHT_DATA_API_KEY) {
    throw new Error("Bright Data is not configured. Set BRIGHT_DATA_API_KEY.");
  }

  if (!brightData) {
    brightData = new bdclient({
      apiKey: env.BRIGHT_DATA_API_KEY,
      webUnlockerZone: env.BRIGHT_DATA_ZONE,
      serpZone: env.BRIGHT_DATA_ZONE,
    });
  }

  return brightData;
}

export async function brightDataSearch(query: string, country = "sg") {
  const response = (await getClient().search.google(query, {
    country,
    numResults: 5,
    format: "json",
  })) as { body: string } | string;

  const body = typeof response === "string" ? response : response.body;

  const parsed = JSON.parse(body) as {
    organic?: Array<{ title?: string; link?: string; description?: string }>;
  };

  return (parsed.organic ?? [])
    .map((result) => ({
      title: normalizeWhitespace(result.title),
      url: normalizeWhitespace(result.link),
      description: normalizeWhitespace(result.description),
    }))
    .filter((result) => result.url);
}

export async function brightDataScrapeMarkdown(url: string) {
  const response = await getClient().scrapeUrl(url, {
    format: "json",
    dataFormat: "markdown",
    timeout: 60_000,
    zone: env.BRIGHT_DATA_ZONE,
  });

  return {
    url,
    markdown: response.body,
    scrapedAt: new Date(),
  };
}
