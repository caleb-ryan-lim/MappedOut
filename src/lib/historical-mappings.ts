import { Prisma, PreApprovalStatus } from "@prisma/client";
import * as XLSX from "xlsx";
import { normalizeCourseCode, normalizeModuleCode, normalizeUniversityName, normalizeWhitespace } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";
import type {
  HistoricalImportSummary,
  HistoricalMappingRecordInput,
  ImportWarning,
  ParsedHistoricalImport,
} from "@/lib/types";

const REQUIRED_COLUMNS = [
  "Faculty",
  "Partner University",
  "PU Course 1",
  "PU Course 1 Title",
  "PU Crse1 Units",
  "PU Course 2",
  "PU Course 2 Title",
  "PU Crse2 Units",
  "NUS Course 1",
  "NUS Course 1 Title",
  "NUS Crse1 Units",
  "NUS Course 2",
  "NUS Course 2 Title",
  "NUS Crse2 Units",
  "Pre Approved?",
] as const;

export function mapPreApprovalStatus(value: string | null | undefined) {
  const normalized = normalizeWhitespace(value).toUpperCase();
  if (normalized === "Y") return PreApprovalStatus.APPROVED;
  if (normalized === "N") return PreApprovalStatus.REJECTED;
  return PreApprovalStatus.UNKNOWN;
}

export function validateHistoricalHeaders(headers: string[]) {
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  return { ok: missing.length === 0, missing };
}

function buildWarning(rowNumber: number, message: string): ImportWarning {
  return { rowNumber, message };
}

function dedupeKey(record: HistoricalMappingRecordInput) {
  return [
    record.partnerUniversityNormalized,
    record.puCourse1Code,
    record.puCourse2Code,
    record.nusCourse1Code,
    record.nusCourse2Code,
  ].join("|");
}

export function parseHistoricalWorkbook(buffer: Buffer, fileName: string): ParsedHistoricalImport {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames.includes("SoC SEP mapping list")
    ? "SoC SEP mapping list"
    : workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Workbook did not contain any worksheets.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const headers = Object.keys(rows[0] ?? {});
  const headerCheck = validateHistoricalHeaders(headers);

  if (!headerCheck.ok) {
    throw new Error(`Missing required columns: ${headerCheck.missing.join(", ")}`);
  }

  const mappings: HistoricalMappingRecordInput[] = [];
  const warnings: ImportWarning[] = [];
  const seen = new Set<string>();
  const uniquePartners = new Set<string>();
  const uniqueModules = new Set<string>();
  let approvedMappings = 0;
  let rejectedMappings = 0;
  let unknownMappings = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const partnerUniversityRaw = normalizeWhitespace(String(row["Partner University"] ?? ""));
    const partnerUniversityNormalized = normalizeUniversityName(partnerUniversityRaw);
    const puCourse1Code = normalizeCourseCode(String(row["PU Course 1"] ?? ""));
    const puCourse2Code = normalizeCourseCode(String(row["PU Course 2"] ?? ""));
    const nusCourse1Code = normalizeModuleCode(String(row["NUS Course 1"] ?? ""));
    const nusCourse2Code = normalizeModuleCode(String(row["NUS Course 2"] ?? ""));
    const preApprovedRaw = normalizeWhitespace(String(row["Pre Approved?"] ?? ""));
    const preApprovalStatus = mapPreApprovalStatus(preApprovedRaw);
    const rowWarnings: ImportWarning[] = [];

    if (!partnerUniversityNormalized) rowWarnings.push(buildWarning(rowNumber, "Missing partner university."));
    if (!puCourse1Code) rowWarnings.push(buildWarning(rowNumber, "Missing PU Course 1 code."));
    if (!normalizeWhitespace(String(row["PU Course 1 Title"] ?? ""))) {
      rowWarnings.push(buildWarning(rowNumber, "Missing PU Course 1 title."));
    }
    if (!normalizeWhitespace(String(row["PU Crse1 Units"] ?? ""))) {
      rowWarnings.push(buildWarning(rowNumber, "Missing PU Course 1 units."));
    }
    if (!nusCourse1Code) rowWarnings.push(buildWarning(rowNumber, "Missing NUS Course 1 code."));
    if (!normalizeWhitespace(String(row["NUS Crse1 Units"] ?? ""))) {
      rowWarnings.push(buildWarning(rowNumber, "Missing NUS Course 1 units."));
    }

    const record: HistoricalMappingRecordInput = {
      faculty: normalizeWhitespace(String(row["Faculty"] ?? "")) || null,
      partnerUniversityRaw,
      partnerUniversityNormalized,
      puCourse1Code: puCourse1Code || null,
      puCourse1Title: normalizeWhitespace(String(row["PU Course 1 Title"] ?? "")) || null,
      puCourse1Units: normalizeWhitespace(String(row["PU Crse1 Units"] ?? "")) || null,
      puCourse2Code: puCourse2Code || null,
      puCourse2Title: normalizeWhitespace(String(row["PU Course 2 Title"] ?? "")) || null,
      puCourse2Units: normalizeWhitespace(String(row["PU Crse2 Units"] ?? "")) || null,
      nusCourse1Code: nusCourse1Code || null,
      nusCourse1TitleRaw: normalizeWhitespace(String(row["NUS Course 1 Title"] ?? "")) || null,
      nusCourse1Units: normalizeWhitespace(String(row["NUS Crse1 Units"] ?? "")) || null,
      nusCourse2Code: nusCourse2Code || null,
      nusCourse2TitleRaw: normalizeWhitespace(String(row["NUS Course 2 Title"] ?? "")) || null,
      nusCourse2Units: normalizeWhitespace(String(row["NUS Crse2 Units"] ?? "")) || null,
      preApprovedRaw: preApprovedRaw || null,
      preApprovalStatus,
      sourceFileName: fileName,
      sourceSheetName: sheetName,
      sourceRowNumber: rowNumber,
      originalRowJson: row,
      warningsJson: rowWarnings,
    };

    const key = dedupeKey(record);
    if (seen.has(key)) {
      warnings.push(buildWarning(rowNumber, "Skipped duplicate mapping row."));
      return;
    }
    seen.add(key);

    mappings.push(record);
    warnings.push(...rowWarnings);
    uniquePartners.add(record.partnerUniversityNormalized);
    if (record.nusCourse1Code) uniqueModules.add(record.nusCourse1Code);
    if (record.nusCourse2Code) uniqueModules.add(record.nusCourse2Code);

    if (preApprovalStatus === PreApprovalStatus.APPROVED) approvedMappings += 1;
    else if (preApprovalStatus === PreApprovalStatus.REJECTED) rejectedMappings += 1;
    else unknownMappings += 1;
  });

  const summary: HistoricalImportSummary = {
    rowsRead: rows.length,
    rowsImported: mappings.length,
    rowsSkipped: rows.length - mappings.length,
    uniquePartnerUniversities: uniquePartners.size,
    uniqueNusModules: uniqueModules.size,
    approvedMappings,
    rejectedMappings,
    unknownMappings,
    warnings,
  };

  return { mappings, summary };
}

export async function importHistoricalMappings(buffer: Buffer, fileName: string) {
  const parsed = parseHistoricalWorkbook(buffer, fileName);
  const run = await prisma.historicalImportRun.create({
    data: {
      sourceFileName: fileName,
      sourceSheetName: parsed.mappings[0]?.sourceSheetName ?? "unknown",
      summaryJson: parsed.summary as Prisma.InputJsonValue,
    },
  });

  if (parsed.mappings.length > 0) {
    await prisma.historicalMapping.createMany({
      data: parsed.mappings.map((mapping) => ({
        ...mapping,
        importRunId: run.id,
        originalRowJson: mapping.originalRowJson as Prisma.InputJsonValue,
        warningsJson: mapping.warningsJson as Prisma.InputJsonValue,
      })),
      skipDuplicates: true,
    });
  }

  return parsed.summary;
}
