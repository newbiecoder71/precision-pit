function parseWeight(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatPercentage(value: number) {
  return value.toFixed(1);
}

export function calculateScalePercentages(weights: {
  lf: string;
  rf: string;
  lr: string;
  rr: string;
}) {
  const lf = parseWeight(weights.lf);
  const rf = parseWeight(weights.rf);
  const lr = parseWeight(weights.lr);
  const rr = parseWeight(weights.rr);

  if ([lf, rf, lr, rr].some((value) => value == null)) {
    return undefined;
  }

  const total = lf! + rf! + lr! + rr!;
  if (total <= 0) {
    return undefined;
  }

  return {
    totalWeight: total.toFixed(0),
    crossweightWedge: formatPercentage(((lf! + rr!) / total) * 100),
    leftSidePercentage: formatPercentage(((lf! + lr!) / total) * 100),
    rearPercentage: formatPercentage(((lr! + rr!) / total) * 100),
  };
}
