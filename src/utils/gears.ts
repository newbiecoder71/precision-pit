export function calculateGearRatio(
  ringTeeth: string,
  pinionTeeth: string,
  quickChangeTopTeeth = "",
  quickChangeBottomTeeth = "",
) {
  const ringValue = Number.parseFloat(ringTeeth);
  const pinionValue = Number.parseFloat(pinionTeeth);

  if (Number.isNaN(ringValue) || Number.isNaN(pinionValue) || pinionValue <= 0) {
    return undefined;
  }

  const baseRatio = ringValue / pinionValue;
  const hasQuickChangeValues =
    quickChangeTopTeeth.trim().length > 0 || quickChangeBottomTeeth.trim().length > 0;

  if (!hasQuickChangeValues) {
    return baseRatio;
  }

  const topValue = Number.parseFloat(quickChangeTopTeeth);
  const bottomValue = Number.parseFloat(quickChangeBottomTeeth);

  if (Number.isNaN(topValue) || Number.isNaN(bottomValue) || bottomValue <= 0) {
    return undefined;
  }

  return baseRatio * (topValue / bottomValue);
}

export function formatGearRatio(ratio?: number) {
  return ratio == null ? "-" : ratio.toFixed(3);
}
