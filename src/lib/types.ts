import { MappingClassification, PreApprovalStatus } from "@prisma/client";

export type ImportWarning = {
  rowNumber: number;
  message: string;
};

export type HistoricalMappingRecordInput = {
  faculty: string | null;
  partnerUniversityRaw: string;
  partnerUniversityNormalized: string;
  puCourse1Code: string | null;
  puCourse1Title: string | null;
  puCourse1Units: string | null;
  puCourse2Code: string | null;
  puCourse2Title: string | null;
  puCourse2Units: string | null;
  nusCourse1Code: string | null;
  nusCourse1TitleRaw: string | null;
  nusCourse1Units: string | null;
  nusCourse2Code: string | null;
  nusCourse2TitleRaw: string | null;
  nusCourse2Units: string | null;
  preApprovedRaw: string | null;
  preApprovalStatus: PreApprovalStatus;
  sourceFileName: string;
  sourceSheetName: string;
  sourceRowNumber: number;
  originalRowJson: Record<string, unknown>;
  warningsJson: ImportWarning[];
};

export type HistoricalImportSummary = {
  rowsRead: number;
  rowsImported: number;
  rowsSkipped: number;
  uniquePartnerUniversities: number;
  uniqueNusModules: number;
  approvedMappings: number;
  rejectedMappings: number;
  unknownMappings: number;
  warnings: ImportWarning[];
};

export type ParsedHistoricalImport = {
  mappings: HistoricalMappingRecordInput[];
  summary: HistoricalImportSummary;
};

export type MapRequest = {
  nusModuleCodes: string[];
  targetSemester?: string;
  preferredCountries?: string[];
  minimumClassification?: MappingClassification;
  overseasOnly?: boolean;
};
