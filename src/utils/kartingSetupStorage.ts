import AsyncStorage from "@react-native-async-storage/async-storage";

export const KARTING_SETUP_STORAGE_KEY = "kartingBaselineSetup";

export type KartingChassisSetup = {
  frontWidth: string;
  rearWidth: string;
  seatPosition: string;
  torsionBars: string;
};

export type KartingTireSetup = {
  lfCircumference: string;
  rfCircumference: string;
  lrCircumference: string;
  rrCircumference: string;
  lfPressure: string;
  rfPressure: string;
  lrPressure: string;
  rrPressure: string;
  lfWheelOffset: string;
  rfWheelOffset: string;
  lrWheelOffset: string;
  rrWheelOffset: string;
  tireCompound: string;
};

export type KartingGearSetup = {
  rearAxleSprocketTeeth: string;
  clutchSprocketTeeth: string;
  notes: string;
};

export type KartingNotesSetup = {
  trackNotes: string;
  rubberNotes: string;
  driverComments: string;
  lapTimeNotes: string;
};

export type KartingBaselineSetup = {
  chassis: KartingChassisSetup;
  tires: KartingTireSetup;
  gears: KartingGearSetup;
  notes: KartingNotesSetup;
};

export const emptyKartingChassisSetup: KartingChassisSetup = {
  frontWidth: "",
  rearWidth: "",
  seatPosition: "",
  torsionBars: "",
};

export const emptyKartingTireSetup: KartingTireSetup = {
  lfCircumference: "",
  rfCircumference: "",
  lrCircumference: "",
  rrCircumference: "",
  lfPressure: "",
  rfPressure: "",
  lrPressure: "",
  rrPressure: "",
  lfWheelOffset: "",
  rfWheelOffset: "",
  lrWheelOffset: "",
  rrWheelOffset: "",
  tireCompound: "",
};

export const emptyKartingGearSetup: KartingGearSetup = {
  rearAxleSprocketTeeth: "",
  clutchSprocketTeeth: "",
  notes: "",
};

export const emptyKartingNotesSetup: KartingNotesSetup = {
  trackNotes: "",
  rubberNotes: "",
  driverComments: "",
  lapTimeNotes: "",
};

export const emptyKartingBaselineSetup: KartingBaselineSetup = {
  chassis: emptyKartingChassisSetup,
  tires: emptyKartingTireSetup,
  gears: emptyKartingGearSetup,
  notes: emptyKartingNotesSetup,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function parseLegacyKartingSetup(value: Record<string, unknown>): KartingBaselineSetup {
  return {
    chassis: {
      frontWidth: toStringValue(value.frontWidth),
      rearWidth: toStringValue(value.rearWidth),
      seatPosition: toStringValue(value.seatPosition),
      torsionBars: toStringValue(value.torsionBars),
    },
    tires: {
      lfCircumference: "",
      rfCircumference: "",
      lrCircumference: "",
      rrCircumference: "",
      lfPressure: toStringValue(value.leftFrontPressure),
      rfPressure: toStringValue(value.rightFrontPressure),
      lrPressure: toStringValue(value.leftRearPressure),
      rrPressure: toStringValue(value.rightRearPressure),
      lfWheelOffset: "",
      rfWheelOffset: "",
      lrWheelOffset: "",
      rrWheelOffset: "",
      tireCompound: toStringValue(value.tireCompound),
    },
    gears: {
      rearAxleSprocketTeeth: "",
      clutchSprocketTeeth: "",
      notes: toStringValue(value.sprocketNotes),
    },
    notes: {
      trackNotes: toStringValue(value.trackNotes),
      rubberNotes: "",
      driverComments: toStringValue(value.driverComments),
      lapTimeNotes: toStringValue(value.gearRatio),
    },
  };
}

function parseKartingSetup(rawValue: string): KartingBaselineSetup {
  try {
    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!isRecord(parsedValue)) {
      return emptyKartingBaselineSetup;
    }

    if ("chassis" in parsedValue || "tires" in parsedValue || "gears" in parsedValue || "notes" in parsedValue) {
      const chassis = isRecord(parsedValue.chassis) ? parsedValue.chassis : {};
      const tires = isRecord(parsedValue.tires) ? parsedValue.tires : {};
      const gears = isRecord(parsedValue.gears) ? parsedValue.gears : {};
      const notes = isRecord(parsedValue.notes) ? parsedValue.notes : {};

      return {
        chassis: {
          ...emptyKartingChassisSetup,
          frontWidth: toStringValue(chassis.frontWidth),
          rearWidth: toStringValue(chassis.rearWidth),
          seatPosition: toStringValue(chassis.seatPosition),
          torsionBars: toStringValue(chassis.torsionBars),
        },
        tires: {
          ...emptyKartingTireSetup,
          lfCircumference: toStringValue(tires.lfCircumference),
          rfCircumference: toStringValue(tires.rfCircumference),
          lrCircumference: toStringValue(tires.lrCircumference),
          rrCircumference: toStringValue(tires.rrCircumference),
          lfPressure: toStringValue(tires.lfPressure),
          rfPressure: toStringValue(tires.rfPressure),
          lrPressure: toStringValue(tires.lrPressure),
          rrPressure: toStringValue(tires.rrPressure),
          lfWheelOffset: toStringValue(tires.lfWheelOffset),
          rfWheelOffset: toStringValue(tires.rfWheelOffset),
          lrWheelOffset: toStringValue(tires.lrWheelOffset),
          rrWheelOffset: toStringValue(tires.rrWheelOffset),
          tireCompound: toStringValue(tires.tireCompound),
        },
        gears: {
          ...emptyKartingGearSetup,
          rearAxleSprocketTeeth: toStringValue(gears.rearAxleSprocketTeeth),
          clutchSprocketTeeth: toStringValue(gears.clutchSprocketTeeth),
          notes: toStringValue(gears.notes),
        },
        notes: {
          ...emptyKartingNotesSetup,
          trackNotes: toStringValue(notes.trackNotes),
          rubberNotes: toStringValue(notes.rubberNotes),
          driverComments: toStringValue(notes.driverComments),
          lapTimeNotes: toStringValue(notes.lapTimeNotes),
        },
      };
    }

    return parseLegacyKartingSetup(parsedValue);
  } catch {
    return emptyKartingBaselineSetup;
  }
}

export async function loadKartingBaselineSetup() {
  const rawValue = await AsyncStorage.getItem(KARTING_SETUP_STORAGE_KEY);
  return rawValue ? parseKartingSetup(rawValue) : emptyKartingBaselineSetup;
}

export async function saveKartingBaselineSetup(setup: KartingBaselineSetup) {
  await AsyncStorage.setItem(KARTING_SETUP_STORAGE_KEY, JSON.stringify(setup));
}
