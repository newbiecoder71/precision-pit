export function calculateGearRatio(ringTeeth: string, pinionTeeth: string) {
  const ringValue = Number.parseFloat(ringTeeth);
  const pinionValue = Number.parseFloat(pinionTeeth);

  if (Number.isNaN(ringValue) || Number.isNaN(pinionValue) || pinionValue <= 0) {
    return undefined;
  }

  return ringValue / pinionValue;
}

export function formatGearRatio(ratio?: number) {
  return ratio == null ? "-" : ratio.toFixed(3);
}
