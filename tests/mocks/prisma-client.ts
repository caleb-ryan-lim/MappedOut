export const MappingClassification = {
  strong: "strong",
  possible: "possible",
  weak: "weak",
  notRecommended: "notRecommended",
} as const;

export const PreApprovalStatus = {
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  UNKNOWN: "UNKNOWN",
} as const;

export const DiscoveredUrlType = {
  OFFICIAL_COURSE_CATALOGUE: "OFFICIAL_COURSE_CATALOGUE",
  EXCHANGE_COURSE_LIST: "EXCHANGE_COURSE_LIST",
  DEPARTMENT_COURSE_PAGE: "DEPARTMENT_COURSE_PAGE",
  PDF_CATALOGUE: "PDF_CATALOGUE",
  IRRELEVANT: "IRRELEVANT",
  UNKNOWN: "UNKNOWN",
} as const;

export const ScrapeJobStatus = {
  queued: "queued",
  running: "running",
  succeeded: "succeeded",
  failed: "failed",
} as const;

export const ScrapeJobType = {
  NUS_PARTNERS: "NUS_PARTNERS",
  PARTNER_DISCOVERY: "PARTNER_DISCOVERY",
  PARTNER_COURSES: "PARTNER_COURSES",
} as const;

export class PrismaClient {
  constructor() {}
}
