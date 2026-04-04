import { calculateScalePercentages } from "./scales";

type AdjustmentInputs = {
  scaleLf: string;
  scaleRf: string;
  scaleLr: string;
  scaleRr: string;
  lfJackBoltTurns: string;
  rfJackBoltTurns: string;
  lrJackBoltTurns: string;
  rrJackBoltTurns: string;
  ballastChangeLbs: string;
  ballastLocationZone: string;
  lfSpringChange: string;
  rfSpringChange: string;
  lrSpringChange: string;
  rrSpringChange: string;
  lfShockChange: string;
  rfShockChange: string;
  lrShockChange: string;
  rrShockChange: string;
};

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeZone(zone: string) {
  return zone.trim().toLowerCase();
}

export function calculateEstimatedScaleEffect(inputs: AdjustmentInputs) {
  const base = calculateScalePercentages({
    lf: inputs.scaleLf,
    rf: inputs.scaleRf,
    lr: inputs.scaleLr,
    rr: inputs.scaleRr,
  });

  if (!base) {
    return undefined;
  }

  let cross = Number.parseFloat(base.crossweightWedge);
  let left = Number.parseFloat(base.leftSidePercentage);
  let rear = Number.parseFloat(base.rearPercentage);

  const lfTurns = parseNumber(inputs.lfJackBoltTurns);
  const rfTurns = parseNumber(inputs.rfJackBoltTurns);
  const lrTurns = parseNumber(inputs.lrJackBoltTurns);
  const rrTurns = parseNumber(inputs.rrJackBoltTurns);

  cross += lfTurns * 0.12;
  cross -= rfTurns * 0.12;
  cross += lrTurns * 0.18;
  cross -= rrTurns * 0.18;

  left += lfTurns * 0.08;
  left -= rfTurns * 0.08;
  left += lrTurns * 0.08;
  left -= rrTurns * 0.08;

  rear -= lfTurns * 0.05;
  rear -= rfTurns * 0.05;
  rear += lrTurns * 0.05;
  rear += rrTurns * 0.05;

  const ballastLbs = parseNumber(inputs.ballastChangeLbs);
  const ballastPct = base.totalWeight ? (ballastLbs / Number.parseFloat(base.totalWeight)) * 100 : 0;
  const zone = normalizeZone(inputs.ballastLocationZone);

  if (ballastPct) {
    if (zone.includes("lf")) {
      left += ballastPct;
      cross += ballastPct;
      rear -= ballastPct;
    } else if (zone.includes("rf")) {
      left -= ballastPct;
      cross -= ballastPct;
      rear -= ballastPct;
    } else if (zone.includes("lr")) {
      left += ballastPct;
      cross -= ballastPct;
      rear += ballastPct;
    } else if (zone.includes("rr")) {
      left -= ballastPct;
      cross += ballastPct;
      rear += ballastPct;
    } else if (zone.includes("left")) {
      left += ballastPct;
    } else if (zone.includes("right")) {
      left -= ballastPct;
    } else if (zone.includes("rear")) {
      rear += ballastPct;
    } else if (zone.includes("front")) {
      rear -= ballastPct;
    }
  }

  const handlingNotes: string[] = [];
  const rfSpring = parseNumber(inputs.rfSpringChange);
  const lrSpring = parseNumber(inputs.lrSpringChange);
  const rrSpring = parseNumber(inputs.rrSpringChange);
  const rfShock = parseNumber(inputs.rfShockChange);
  const lrShock = parseNumber(inputs.lrShockChange);
  const rrShock = parseNumber(inputs.rrShockChange);

  if (rfSpring > 0) handlingNotes.push("Stiffer RF spring usually tightens entry and middle.");
  if (rfSpring < 0) handlingNotes.push("Softer RF spring usually frees entry and middle.");
  if (lrSpring > 0) handlingNotes.push("Stiffer LR spring usually adds drive and side bite.");
  if (lrSpring < 0) handlingNotes.push("Softer LR spring usually reduces drive off.");
  if (rrSpring > 0) handlingNotes.push("Stiffer RR spring usually tightens exit balance.");
  if (rrSpring < 0) handlingNotes.push("Softer RR spring usually frees exit balance.");
  if (rfShock > 0) handlingNotes.push("More RF shock can slow RF travel and tighten the platform on entry.");
  if (rfShock < 0) handlingNotes.push("Less RF shock can speed RF travel and free the platform on entry.");
  if (lrShock > 0) handlingNotes.push("More LR shock can help hold LR load and support drive off.");
  if (lrShock < 0) handlingNotes.push("Less LR shock can let LR load come off quicker on exit.");
  if (rrShock > 0) handlingNotes.push("More RR shock can calm RR movement and tighten exit feel.");
  if (rrShock < 0) handlingNotes.push("Less RR shock can free the car up on exit.");

  return {
    base,
    estimatedCrossweightWedge: cross.toFixed(1),
    estimatedLeftSidePercentage: left.toFixed(1),
    estimatedRearPercentage: rear.toFixed(1),
    handlingNotes,
  };
}
