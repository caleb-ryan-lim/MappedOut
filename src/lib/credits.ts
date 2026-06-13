export function normalizeCredits(raw: string | number | null | undefined) {
  const value = String(raw ?? "").trim();
  if (!value) {
    return {
      creditsNormalized: null,
      creditSystem: null,
      warning: "Credit value missing.",
    };
  }

  const numeric = Number(value.match(/(\d+(\.\d+)?)/)?.[1] ?? "");
  const lower = value.toLowerCase();

  if (!Number.isFinite(numeric)) {
    return {
      creditsNormalized: null,
      creditSystem: null,
      warning: `Unable to parse credits from "${value}".`,
    };
  }

  if (lower.includes("ects")) {
    return { creditsNormalized: numeric / 2, creditSystem: "ECTS", warning: null };
  }

  if (lower.includes("uk credit")) {
    return {
      creditsNormalized: numeric / 4,
      creditSystem: "UK_CREDITS",
      warning: null,
    };
  }

  if (lower.includes("australian") || lower.includes("credit point")) {
    return {
      creditsNormalized: numeric / 4,
      creditSystem: "AU_CREDIT_POINTS",
      warning: null,
    };
  }

  if (lower.includes("us") || numeric <= 8) {
    return { creditsNormalized: numeric, creditSystem: "US_CREDITS", warning: null };
  }

  return {
    creditsNormalized: numeric,
    creditSystem: "UNKNOWN",
    warning: "Credit system unknown, confidence reduced.",
  };
}

export function workloadScoreFromUnits(
  nusUnits: number | null | undefined,
  overseasUnits: number | null | undefined,
) {
  if (!nusUnits || !overseasUnits) return 0.45;
  if (overseasUnits <= 3) return 0.1;
  const ratio = Math.min(nusUnits, overseasUnits) / Math.max(nusUnits, overseasUnits);
  return Number(ratio.toFixed(2));
}
