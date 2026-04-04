export type TireMeasurementDisplayMode = "fraction" | "decimal";

export function parseCircumferenceValue(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return Number.NaN;
  }

  const mixedNumberMatch = trimmedValue.match(
    /^(\d+)(?:\s+((?:1|3|5|7)\/8|1\/4|1\/2|3\/4))?$/,
  );
  if (mixedNumberMatch) {
    const wholeNumber = Number.parseFloat(mixedNumberMatch[1]);
    const fractionMap: Record<string, number> = {
      "1/8": 1 / 8,
      "1/4": 1 / 4,
      "3/8": 3 / 8,
      "1/2": 1 / 2,
      "5/8": 5 / 8,
      "3/4": 3 / 4,
      "7/8": 7 / 8,
    };
    const fraction = mixedNumberMatch[2] ? fractionMap[mixedNumberMatch[2]] ?? 0 : 0;
    return wholeNumber + fraction;
  }

  return Number.parseFloat(trimmedValue);
}

export function calculateStaggerValue(leftValue: string, rightValue: string) {
  const left = parseCircumferenceValue(leftValue);
  const right = parseCircumferenceValue(rightValue);

  if (Number.isNaN(left) || Number.isNaN(right)) {
    return null;
  }

  return right - left;
}

export function formatMeasurementValue(value: number, displayMode: TireMeasurementDisplayMode) {
  if (displayMode === "decimal") {
    return value.toFixed(2);
  }

  const isNegative = value < 0;
  const absoluteValue = Math.abs(value);
  const wholeNumber = Math.floor(absoluteValue);
  const roundedEighths = Math.round((absoluteValue - wholeNumber) * 8);

  let normalizedWhole = wholeNumber;
  let normalizedEighths = roundedEighths;

  if (normalizedEighths === 8) {
    normalizedWhole += 1;
    normalizedEighths = 0;
  }

  const fractionMap: Record<number, string> = {
    0: "",
    1: "1/8",
    2: "1/4",
    3: "3/8",
    4: "1/2",
    5: "5/8",
    6: "3/4",
    7: "7/8",
  };

  const fraction = fractionMap[normalizedEighths];
  const formattedValue =
    normalizedWhole === 0
      ? fraction || "0"
      : fraction
        ? `${normalizedWhole} ${fraction}`
        : `${normalizedWhole}`;

  return isNegative && formattedValue !== "0" ? `-${formattedValue}` : formattedValue;
}
