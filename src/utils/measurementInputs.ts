import { formatMeasurementValue, parseCircumferenceValue } from "./tireMeasurements";

export function sanitizeFractionMeasurementInput(value: string) {
  return value
    .replace(/[^0-9./\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*\/\s*/g, "/")
    .replace(/^\s+/, "");
}

export function normalizeFractionMeasurementInput(value: string) {
  const sanitized = sanitizeFractionMeasurementInput(value).trim();

  if (!sanitized) {
    return "";
  }

  const parsed = parseCircumferenceValue(sanitized);
  return Number.isFinite(parsed) ? formatMeasurementValue(parsed, "fraction") : sanitized;
}
