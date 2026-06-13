import { env, hasBrightData, hasDatabase } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export type AdminStatus = {
  database: {
    configured: boolean;
    connected: boolean;
    schemaReady: boolean;
    error: string | null;
  };
  brightData: {
    configured: boolean;
    apiKeyConfigured: boolean;
    zoneConfigured: boolean;
  };
  data: {
    historicalImportRuns: number | null;
    historicalMappings: number | null;
    partnerUniversities: number | null;
    overseasCourses: number | null;
    scrapeJobs: number | null;
  };
  guidance: string[];
};

export type EmptyState = {
  code: "NO_HISTORICAL_MAPPINGS" | "NO_PARTNER_UNIVERSITIES" | "NO_RESULTS";
  title: string;
  message: string;
};

export function buildGuidance(status: Omit<AdminStatus, "guidance">) {
  const guidance: string[] = [];

  if (!status.database.configured) {
    guidance.push("Set DATABASE_URL in Vercel before using database-backed routes.");
    return guidance;
  }

  if (!status.database.connected) {
    guidance.push("Check that the hosted Postgres instance is reachable from Vercel.");
    return guidance;
  }

  if (!status.database.schemaReady) {
    guidance.push("Run Prisma migrations against the production database before using ranking.");
    return guidance;
  }

  if ((status.data.historicalMappings ?? 0) === 0) {
    guidance.push("Import the SoC SEP mapping workbook into the backend as the first production setup step.");
  }

  if ((status.data.partnerUniversities ?? 0) === 0) {
    guidance.push("Refresh NUS partner universities in the backend after the workbook import.");
  }

  if (!status.brightData.configured) {
    guidance.push("Set BRIGHT_DATA_API_KEY and BRIGHT_DATA_ZONE to enable live partner course scraping.");
  } else if ((status.data.overseasCourses ?? 0) === 0) {
    guidance.push("Run pilot Bright Data scraping in the backend to populate current partner course evidence.");
  }

  return guidance;
}

export async function getAdminStatus(): Promise<AdminStatus> {
  const baseStatus: Omit<AdminStatus, "guidance"> = {
    database: {
      configured: hasDatabase,
      connected: false,
      schemaReady: false,
      error: null,
    },
    brightData: {
      configured: hasBrightData,
      apiKeyConfigured: Boolean(env.BRIGHT_DATA_API_KEY),
      zoneConfigured: Boolean(env.BRIGHT_DATA_ZONE),
    },
    data: {
      historicalImportRuns: null,
      historicalMappings: null,
      partnerUniversities: null,
      overseasCourses: null,
      scrapeJobs: null,
    },
  };

  if (!hasDatabase) {
    return {
      ...baseStatus,
      guidance: buildGuidance(baseStatus),
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    baseStatus.database.connected = true;
  } catch (error) {
    baseStatus.database.error =
      error instanceof Error ? error.message : "Unable to connect to the configured database.";
    return {
      ...baseStatus,
      guidance: buildGuidance(baseStatus),
    };
  }

  try {
    const [
      historicalImportRuns,
      historicalMappings,
      partnerUniversities,
      overseasCourses,
      scrapeJobs,
    ] = await Promise.all([
      prisma.historicalImportRun.count(),
      prisma.historicalMapping.count(),
      prisma.partnerUniversity.count(),
      prisma.overseasCourse.count(),
      prisma.scrapeJob.count(),
    ]);

    baseStatus.database.schemaReady = true;
    baseStatus.data = {
      historicalImportRuns,
      historicalMappings,
      partnerUniversities,
      overseasCourses,
      scrapeJobs,
    };
  } catch (error) {
    baseStatus.database.error =
      error instanceof Error
        ? error.message
        : "Database is reachable but the schema does not appear ready.";
  }

  return {
    ...baseStatus,
    guidance: buildGuidance(baseStatus),
  };
}

export function getConfigErrorResponse(status: AdminStatus) {
  if (!status.database.configured) {
    return {
      status: 503,
      errorCode: "DATABASE_NOT_CONFIGURED",
      error: "Production database is not configured yet. Set DATABASE_URL before using this route.",
    };
  }

  if (!status.database.connected) {
    return {
      status: 503,
      errorCode: "DATABASE_UNREACHABLE",
      error: "The configured production database is not reachable from the app runtime.",
    };
  }

  if (!status.database.schemaReady) {
    return {
      status: 503,
      errorCode: "DATABASE_SCHEMA_NOT_READY",
      error: "The database is reachable, but Prisma migrations still need to be applied.",
    };
  }

  return null;
}

export function getBrightDataErrorResponse() {
  return {
    status: 503,
    errorCode: "BRIGHT_DATA_NOT_CONFIGURED",
    error:
      "Bright Data is not configured yet. Set BRIGHT_DATA_API_KEY and BRIGHT_DATA_ZONE to enable scraping.",
  };
}
