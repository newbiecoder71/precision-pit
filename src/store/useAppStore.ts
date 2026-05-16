import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  createSessionFromUrl,
  isSupabaseConfigured,
  passwordResetRedirectUrl,
  supabase,
  supabasePublishableKey,
  supabaseUrl,
} from "../lib/supabase";
import {
  createDefaultChecklistSections,
  RaceNightChecklistSection,
} from "../data/raceNight";
import { findDirtOvalTrackByName } from "../data/dirtOvalTracks";
import { getRaceCarTypeOptions } from "../data/racing";
import { formatStoredDateValue, getDateSortValue } from "../utils/date";
import { getPasswordValidationMessage } from "../utils/password";

const STORAGE_KEYS = {
  hasSeenOnboarding: "hasSeenOnboarding",
  hasSeenHomeTutorial: "hasSeenHomeTutorial",
  hasExistingLoginProfile: "hasExistingLoginProfile",
  authSnapshot: "authSnapshot",
  brandingPreferences: "brandingPreferences",
  chassisSetup: "chassisSetup",
  tireSetup: "tireSetup",
  suspensionSetup: "suspensionSetup",
  tireInventory: "tireInventory",
  gearInventory: "gearInventory",
  savedTracks: "savedTracks",
  raceEvents: "raceEvents",
  raceNights: "raceNights",
};

export type ChassisSetup = {
  chassisBuilder: string;
  rideHeightLf: string;
  rideHeightRf: string;
  rideHeightLr: string;
  rideHeightRr: string;
  topWingAngle: string;
  sliderPosition: string;
  wickerBillSize: string;
  noseWingAngle: string;
  scaleLf: string;
  scaleRf: string;
  scaleLr: string;
  scaleRr: string;
  crossweightWedge: string;
  leftSidePercentage: string;
  rearPercentage: string;
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
  ballastLocation: string;
  wheelbaseNotes: string;
  frameAttitude: string;
};

export type TireSetup = {
  lfCircumference: string;
  rfCircumference: string;
  lrCircumference: string;
  rrCircumference: string;
  lfWheelOffset: string;
  rfWheelOffset: string;
  lrWheelOffset: string;
  rrWheelOffset: string;
  lfPressure: string;
  rfPressure: string;
  lrPressure: string;
  rrPressure: string;
  lfTempInner: string;
  lfTempMiddle: string;
  lfTempOuter: string;
  rfTempInner: string;
  rfTempMiddle: string;
  rfTempOuter: string;
  lrTempInner: string;
  lrTempMiddle: string;
  lrTempOuter: string;
  rrTempInner: string;
  rrTempMiddle: string;
  rrTempOuter: string;
};

export type SuspensionSetup = {
  frontSprings: string;
  frontShocks: string;
  camber: string;
  caster: string;
  toe: string;
  travelBumpStops: string;
  rearSprings: string;
  rearShocks: string;
  trailingArmAngles: string;
  pullBarLiftArm: string;
  jBarPanhardHeight: string;
  birdcageIndexingNotes: string;
};

export type GearSetup = {
  ringTeeth: string;
  pinionTeeth: string;
  quickChangeTopTeeth: string;
  quickChangeBottomTeeth: string;
  notes: string;
};

export type BrandingPreferences = {
  primaryColor: string;
  secondaryColor: string;
  carNumberImageUri: string;
  profileBackgroundImageUri: string;
};

export type TeamRole = "Owner" | "Driver" | "Crew Chief" | "Crew";

export type TeamMember = {
  id: string;
  userId?: string;
  email: string;
  name: string;
  role: TeamRole;
  status: "active";
};

export type PendingInvite = {
  id: string;
  email: string;
  role: TeamRole;
  invitedAt: string;
  status: "pending";
};

const teamRoleSortOrder: Record<TeamRole, number> = {
  Owner: 0,
  Driver: 1,
  "Crew Chief": 2,
  Crew: 3,
};

function normalizeTeamRole(value: string): TeamRole {
  const normalizedValue = value.trim().toLowerCase();

  switch (normalizedValue) {
    case "owner":
      return "Owner";
    case "driver":
      return "Driver";
    case "crew chief":
      return "Crew Chief";
    case "crew member":
    case "crew":
      return "Crew";
    default:
      throw new Error("Invalid team-member role.");
  }
}

export type RaceEvent = {
  id: string;
  title: string;
  trackName: string;
  eventDate: string;
  createdAt: string;
};

export type SavedTrack = {
  id: string;
  name: string;
  trackType: string;
  banking: "High-Bank" | "Semi-Bank" | "Flat";
  length: string;
  notes: string;
  createdAt: string;
};

export const raceNightStageOrder = ["hotLaps", "heat", "bFeature", "aFeature"] as const;

export type RaceNightStageKey = (typeof raceNightStageOrder)[number];

export const raceNightStageLabels: Record<RaceNightStageKey, string> = {
  hotLaps: "Hot Laps",
  heat: "Heat",
  bFeature: "B-Feature",
  aFeature: "A-Feature",
};

export type RaceNightStageData = {
  started: boolean;
  weatherZipCode: string;
  weatherTemperature: string;
  humidity: string;
  windCondition: string;
  skyCondition: string;
  precipitation: string;
  weatherNotes: string;
  trackTemperature: string;
  trackType: string;
  trackBanking: string;
  trackLength: string;
  trackSurface: string;
  moistureState: string;
  trackNotes: string;
  totalLaps: string;
  startPosition: string;
  finishPosition: string;
  lapTimer: {
    entries: Array<{
      id: string;
      lapNumber: number;
      durationMs: number;
      caution: boolean;
    }>;
  };
  setupAdjustments: {
    chassis: ChassisSetup;
    tires: TireSetup;
    suspension: SuspensionSetup;
    gears: GearSetup;
    notes: string;
  };
  setupChanges: string;
  driverNotes: string;
  crewNotes: string;
  lapTimes: string;
  checklistSections: RaceNightChecklistSection[];
};

export type RaceNight = {
  id: string;
  eventId: string;
  eventTitle: string;
  trackName: string;
  eventDate: string;
  lastViewedStage?: RaceNightStageKey;
  racingType?: string;
  raceCarType?: string;
  carClass?: string;
  status: "active" | "completed" | "rainout";
  rainoutStage?: RaceNightStageKey;
  createdAt: string;
  weatherTemperature: string;
  humidity: string;
  windCondition: string;
  skyCondition: string;
  precipitation: string;
  weatherNotes: string;
  trackTemperature: string;
  trackType: string;
  trackBanking: string;
  trackLength: string;
  trackSurface: string;
  moistureState: string;
  trackNotes: string;
  heatStartPosition: string;
  heatFinishPosition: string;
  featureStartPosition: string;
  featureFinishPosition: string;
  setupChanges: string;
  driverNotes: string;
  crewNotes: string;
  lapTimes: string;
  checklistSections: RaceNightChecklistSection[];
  stageSessions: Record<RaceNightStageKey, RaceNightStageData>;
};

export type GearInventoryItem = {
  id: string;
  label: string;
  ringTeeth: string;
  pinionTeeth: string;
  quickChangeTopTeeth: string;
  quickChangeBottomTeeth: string;
  ratio?: string;
  notes: string;
  createdAt: string;
};

export type TireInventoryItem = {
  id: string;
  label: string;
  position: string;
  circumference: string;
  pressure: string;
  notes: string;
  createdAt: string;
};

const emptyChassisSetup: ChassisSetup = {
  chassisBuilder: "",
  rideHeightLf: "",
  rideHeightRf: "",
  rideHeightLr: "",
  rideHeightRr: "",
  topWingAngle: "",
  sliderPosition: "",
  wickerBillSize: "",
  noseWingAngle: "",
  scaleLf: "",
  scaleRf: "",
  scaleLr: "",
  scaleRr: "",
  crossweightWedge: "",
  leftSidePercentage: "",
  rearPercentage: "",
  lfJackBoltTurns: "",
  rfJackBoltTurns: "",
  lrJackBoltTurns: "",
  rrJackBoltTurns: "",
  ballastChangeLbs: "",
  ballastLocationZone: "",
  lfSpringChange: "",
  rfSpringChange: "",
  lrSpringChange: "",
  rrSpringChange: "",
  lfShockChange: "",
  rfShockChange: "",
  lrShockChange: "",
  rrShockChange: "",
  ballastLocation: "",
  wheelbaseNotes: "",
  frameAttitude: "",
};

const emptyTireSetup: TireSetup = {
  lfCircumference: "",
  rfCircumference: "",
  lrCircumference: "",
  rrCircumference: "",
  lfWheelOffset: "",
  rfWheelOffset: "",
  lrWheelOffset: "",
  rrWheelOffset: "",
  lfPressure: "",
  rfPressure: "",
  lrPressure: "",
  rrPressure: "",
  lfTempInner: "",
  lfTempMiddle: "",
  lfTempOuter: "",
  rfTempInner: "",
  rfTempMiddle: "",
  rfTempOuter: "",
  lrTempInner: "",
  lrTempMiddle: "",
  lrTempOuter: "",
  rrTempInner: "",
  rrTempMiddle: "",
  rrTempOuter: "",
};

const emptySuspensionSetup: SuspensionSetup = {
  frontSprings: "",
  frontShocks: "",
  camber: "",
  caster: "",
  toe: "",
  travelBumpStops: "",
  rearSprings: "",
  rearShocks: "",
  trailingArmAngles: "",
  pullBarLiftArm: "",
  jBarPanhardHeight: "",
  birdcageIndexingNotes: "",
};

const emptyGearSetup: GearSetup = {
  ringTeeth: "",
  pinionTeeth: "",
  quickChangeTopTeeth: "",
  quickChangeBottomTeeth: "",
  notes: "",
};

const emptyTireInventory: TireInventoryItem[] = [];
const emptyGearInventory: GearInventoryItem[] = [];
const emptySavedTracks: SavedTrack[] = [];
const emptyRaceEvents: RaceEvent[] = [];
const emptyRaceNights: RaceNight[] = [];
const defaultBrandingPreferences: BrandingPreferences = {
  primaryColor: "#1780D4",
  secondaryColor: "#8ED4FF",
  carNumberImageUri: "",
  profileBackgroundImageUri: "",
};

function buildChassisBaselineSummary(setup: ChassisSetup) {
  const parts: string[] = [];

  if (setup.chassisBuilder.trim()) parts.push(`Builder: ${setup.chassisBuilder.trim()}`);
  if (setup.rideHeightLf.trim() || setup.rideHeightRf.trim() || setup.rideHeightLr.trim() || setup.rideHeightRr.trim()) {
    parts.push(
      `Ride Ht LF ${setup.rideHeightLf.trim() || "-"} / RF ${setup.rideHeightRf.trim() || "-"} / LR ${setup.rideHeightLr.trim() || "-"} / RR ${setup.rideHeightRr.trim() || "-"}`,
    );
  }
  if (setup.crossweightWedge.trim()) parts.push(`Cross/Wedge ${setup.crossweightWedge.trim()}`);
  if (setup.leftSidePercentage.trim()) parts.push(`Left % ${setup.leftSidePercentage.trim()}`);
  if (setup.rearPercentage.trim()) parts.push(`Rear % ${setup.rearPercentage.trim()}`);
  if (setup.ballastLocation.trim()) parts.push(`Ballast ${setup.ballastLocation.trim()}`);
  if (setup.wheelbaseNotes.trim()) parts.push(`Wheelbase ${setup.wheelbaseNotes.trim()}`);
  if (setup.frameAttitude.trim()) parts.push(`Frame ${setup.frameAttitude.trim()}`);

  return parts.join(" | ");
}

function buildTireBaselineSummary(setup: TireSetup) {
  const parts: string[] = [];

  if (
    setup.lfCircumference.trim() ||
    setup.rfCircumference.trim() ||
    setup.lrCircumference.trim() ||
    setup.rrCircumference.trim()
  ) {
    parts.push(
      `Circ LF ${setup.lfCircumference.trim() || "-"} / RF ${setup.rfCircumference.trim() || "-"} / LR ${setup.lrCircumference.trim() || "-"} / RR ${setup.rrCircumference.trim() || "-"}`,
    );
  }

  if (
    setup.lfPressure.trim() ||
    setup.rfPressure.trim() ||
    setup.lrPressure.trim() ||
    setup.rrPressure.trim()
  ) {
    parts.push(
      `Pressure LF ${setup.lfPressure.trim() || "-"} / RF ${setup.rfPressure.trim() || "-"} / LR ${setup.lrPressure.trim() || "-"} / RR ${setup.rrPressure.trim() || "-"}`,
    );
  }

  if (
    setup.lfWheelOffset.trim() ||
    setup.rfWheelOffset.trim() ||
    setup.lrWheelOffset.trim() ||
    setup.rrWheelOffset.trim()
  ) {
    parts.push(
      `Wheel Offset LF ${setup.lfWheelOffset.trim() || "-"} / RF ${setup.rfWheelOffset.trim() || "-"} / LR ${setup.lrWheelOffset.trim() || "-"} / RR ${setup.rrWheelOffset.trim() || "-"}`,
    );
  }

  return parts.join(" | ");
}

function buildHotLapsBaselineStage(
  chassisSetup: ChassisSetup,
  tireSetup: TireSetup,
  suspensionSetup: SuspensionSetup,
) {
  const baseStage = createEmptyRaceNightStageData();

  return normalizeRaceNightStageData({
    ...baseStage,
    setupAdjustments: {
      ...baseStage.setupAdjustments,
      chassis: {
        ...emptyChassisSetup,
        ...chassisSetup,
      },
      tires: {
        ...emptyTireSetup,
        ...tireSetup,
      },
      suspension: {
        ...emptySuspensionSetup,
        ...suspensionSetup,
      },
    },
  });
}

function cloneChecklistSections(
  sections: RaceNightChecklistSection[] = createDefaultChecklistSections(),
): RaceNightChecklistSection[] {
  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
    })),
  }));
}

function mergeChecklistSectionsForSync(
  localSections: RaceNightChecklistSection[],
  remoteSections: RaceNightChecklistSection[],
): RaceNightChecklistSection[] {
  const localSectionMap = new Map(localSections.map((section) => [section.id, section]));

  return remoteSections.map((remoteSection) => {
    const localSection = localSectionMap.get(remoteSection.id);
    const localItemMap = new Map((localSection?.items ?? []).map((item) => [item.id, item]));

    return {
      ...remoteSection,
      items: remoteSection.items.map((remoteItem) => {
        const localItem = localItemMap.get(remoteItem.id);
        const checked = localItem ? localItem.checked : remoteItem.checked;
        const checkedByName = checked
          ? localItem
            ? localItem.checkedByName
            : remoteItem.checkedByName
          : undefined;

        return {
          ...remoteItem,
          checked,
          checkedByName,
        };
      }),
    };
  });
}

function mergeRaceNightChecklistForSync(localRaceNight: RaceNight, remoteRaceNight: RaceNight): RaceNight {
  const nextStageSessions = { ...remoteRaceNight.stageSessions };

  raceNightStageOrder.forEach((stageKey) => {
    const localStage = localRaceNight.stageSessions[stageKey];
    const remoteStage = remoteRaceNight.stageSessions[stageKey];

    nextStageSessions[stageKey] = {
      ...remoteStage,
      checklistSections: mergeChecklistSectionsForSync(
        localStage.checklistSections,
        remoteStage.checklistSections,
      ),
    };
  });

  return normalizeRaceNightRecord({
    ...remoteRaceNight,
    stageSessions: nextStageSessions,
  });
}

function mergeRaceNightChecklistForSave(localRaceNight: RaceNight, remoteRaceNight: RaceNight): RaceNight {
  const nextStageSessions = { ...localRaceNight.stageSessions };

  raceNightStageOrder.forEach((stageKey) => {
    const localStage = localRaceNight.stageSessions[stageKey];
    const remoteStage = remoteRaceNight.stageSessions[stageKey];

    nextStageSessions[stageKey] = {
      ...localStage,
      checklistSections: mergeChecklistSectionsForSync(
        localStage.checklistSections,
        remoteStage.checklistSections,
      ),
    };
  });

  return normalizeRaceNightRecord({
    ...localRaceNight,
    stageSessions: nextStageSessions,
  });
}

function normalizeTrackName(value: string) {
  return value.trim().toLowerCase();
}

function sortTeamMembers(members: TeamMember[]) {
  return [...members].sort((a, b) => {
    const roleDifference = teamRoleSortOrder[a.role] - teamRoleSortOrder[b.role];
    if (roleDifference !== 0) {
      return roleDifference;
    }

    return a.name.localeCompare(b.name);
  });
}

function normalizeTeamVehicleSelections(trackType?: string, racingType?: string, carClass?: string) {
  const nextTrackType = trackType?.trim() || undefined;
  const nextRacingType = racingType?.trim() || undefined;
  const nextCarClass = carClass?.trim() || undefined;

  if (nextTrackType === "Sprint Cars") {
    return {
      trackType: "Dirt Oval",
      racingType: "Sprint Car",
      carClass: nextRacingType ?? nextCarClass,
    };
  }

  if (nextRacingType === "Sprint Cars") {
    return {
      trackType: nextTrackType ?? "Dirt Oval",
      racingType: "Sprint Car",
      carClass: nextCarClass,
    };
  }

  return {
    trackType: nextTrackType,
    racingType: nextRacingType,
    carClass: nextCarClass,
  };
}

function findSavedTrackMatch(savedTracks: SavedTrack[], trackName: string) {
  const normalizedTrackName = normalizeTrackName(trackName);
  return savedTracks.find((track) => normalizeTrackName(track.name) === normalizedTrackName);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createEmptyRaceNightStageData(): RaceNightStageData {
  return {
    started: false,
    weatherZipCode: "",
    weatherTemperature: "",
    humidity: "",
    windCondition: "",
    skyCondition: "",
    precipitation: "",
    weatherNotes: "",
    trackTemperature: "",
    trackType: "",
    trackBanking: "",
    trackLength: "",
    trackSurface: "",
    moistureState: "",
    trackNotes: "",
    totalLaps: "",
    startPosition: "",
    finishPosition: "",
    lapTimer: {
      entries: [],
    },
    setupAdjustments: {
      chassis: {
        ...emptyChassisSetup,
      },
      tires: {
        ...emptyTireSetup,
      },
      suspension: {
        ...emptySuspensionSetup,
      },
      gears: {
        ...emptyGearSetup,
      },
      notes: "",
    },
    setupChanges: "",
    driverNotes: "",
    crewNotes: "",
    lapTimes: "",
    checklistSections: createDefaultChecklistSections(),
  };
}

function isRaceNightStageStarted(stage: RaceNightStageData) {
  return (
      stage.started ||
    [
      stage.weatherZipCode,
      stage.weatherTemperature,
      stage.humidity,
      stage.windCondition,
      stage.skyCondition,
      stage.precipitation,
      stage.weatherNotes,
      stage.trackTemperature,
      stage.trackType,
      stage.trackBanking,
      stage.trackLength,
      stage.trackSurface,
      stage.moistureState,
      stage.trackNotes,
      stage.totalLaps,
      stage.startPosition,
      stage.finishPosition,
      ...Object.values(stage.setupAdjustments.chassis),
      ...Object.values(stage.setupAdjustments.tires),
      ...Object.values(stage.setupAdjustments.suspension),
      ...Object.values(stage.setupAdjustments.gears),
      stage.setupAdjustments.notes,
      stage.setupChanges,
      stage.driverNotes,
      stage.crewNotes,
      stage.lapTimes,
    ].some((value) => value.trim().length > 0) ||
    stage.checklistSections.some((section) => section.items.some((item) => item.checked))
  );
}

function normalizeRaceNightStageData(stage?: Partial<RaceNightStageData>): RaceNightStageData {
  const legacySetupAdjustments: Record<string, unknown> = isRecord(stage?.setupAdjustments)
    ? stage.setupAdjustments
    : {};
  const legacyChassis = isRecord(legacySetupAdjustments["chassis"])
    ? legacySetupAdjustments["chassis"]
    : {};
  const legacyTires = isRecord(legacySetupAdjustments["tires"])
    ? legacySetupAdjustments["tires"]
    : {};
  const legacySuspension = isRecord(legacySetupAdjustments["suspension"])
    ? legacySetupAdjustments["suspension"]
    : {};
  const legacyGears = isRecord(legacySetupAdjustments["gears"])
    ? legacySetupAdjustments["gears"]
    : {};
  const legacyGearNotes =
    typeof legacySetupAdjustments["gears"] === "string" ? legacySetupAdjustments["gears"] : "";

  const nextStage: RaceNightStageData = {
    ...createEmptyRaceNightStageData(),
    ...stage,
    lapTimer: {
      entries: stage?.lapTimer?.entries?.map((entry) => ({ ...entry })) ?? [],
    },
    setupAdjustments: {
      ...createEmptyRaceNightStageData().setupAdjustments,
      ...legacySetupAdjustments,
      chassis: {
        ...emptyChassisSetup,
        ...legacyChassis,
      },
      tires: {
        ...emptyTireSetup,
        ...legacyTires,
      },
      suspension: {
        ...emptySuspensionSetup,
        ...legacySuspension,
      },
      gears: {
        ...emptyGearSetup,
        ...legacyGears,
        notes:
          typeof legacyGears["notes"] === "string" && legacyGears["notes"].trim().length
            ? legacyGears["notes"]
            : legacyGearNotes,
      },
    },
    checklistSections:
      stage?.checklistSections?.length
        ? cloneChecklistSections(stage.checklistSections)
        : createDefaultChecklistSections(),
  };

  if (!nextStage.setupAdjustments.tires.lfWheelOffset.trim() && typeof legacyChassis["wheelOffsetLf"] === "string") {
    nextStage.setupAdjustments.tires.lfWheelOffset = legacyChassis["wheelOffsetLf"];
  }
  if (!nextStage.setupAdjustments.tires.rfWheelOffset.trim() && typeof legacyChassis["wheelOffsetRf"] === "string") {
    nextStage.setupAdjustments.tires.rfWheelOffset = legacyChassis["wheelOffsetRf"];
  }
  if (!nextStage.setupAdjustments.tires.lrWheelOffset.trim() && typeof legacyChassis["wheelOffsetLr"] === "string") {
    nextStage.setupAdjustments.tires.lrWheelOffset = legacyChassis["wheelOffsetLr"];
  }
  if (!nextStage.setupAdjustments.tires.rrWheelOffset.trim() && typeof legacyChassis["wheelOffsetRr"] === "string") {
    nextStage.setupAdjustments.tires.rrWheelOffset = legacyChassis["wheelOffsetRr"];
  }

  nextStage.started = isRaceNightStageStarted(nextStage);
  return nextStage;
}

function createLegacyBaseStageData(raceNight: Partial<RaceNight>): RaceNightStageData {
  return normalizeRaceNightStageData({
    weatherTemperature: raceNight.weatherTemperature,
    humidity: raceNight.humidity,
    windCondition: raceNight.windCondition,
    skyCondition: raceNight.skyCondition,
    precipitation: raceNight.precipitation,
    weatherNotes: raceNight.weatherNotes,
    trackTemperature: raceNight.trackTemperature,
    trackType: raceNight.racingType ?? "",
    trackBanking: "",
    trackLength: "",
    trackSurface: raceNight.trackSurface,
    moistureState: raceNight.moistureState,
    trackNotes: raceNight.trackNotes,
    totalLaps: "",
    setupAdjustments: {
      ...createEmptyRaceNightStageData().setupAdjustments,
      notes: raceNight.setupChanges ?? "",
    },
    setupChanges: raceNight.setupChanges,
    driverNotes: raceNight.driverNotes,
    crewNotes: raceNight.crewNotes,
    lapTimes: raceNight.lapTimes,
    checklistSections: raceNight.checklistSections,
  });
}

function backfillTrackMetadataFromBuiltInTrack(raceNight: RaceNight): RaceNight {
  const builtInTrack = findDirtOvalTrackByName(raceNight.trackName);

  if (!builtInTrack) {
    return raceNight;
  }

  const fillStage = (stage: RaceNightStageData): RaceNightStageData =>
    normalizeRaceNightStageData({
      ...stage,
      trackType: stage.trackType || builtInTrack.trackType || "",
      trackBanking: stage.trackBanking || builtInTrack.banking || "",
      trackLength: stage.trackLength || builtInTrack.length || "",
    });

  return {
    ...raceNight,
    stageSessions: {
      hotLaps: fillStage(raceNight.stageSessions.hotLaps),
      heat: fillStage(raceNight.stageSessions.heat),
      bFeature: fillStage(raceNight.stageSessions.bFeature),
      aFeature: fillStage(raceNight.stageSessions.aFeature),
    },
  };
}

function getDisplayFeatureStage(stageSessions: Record<RaceNightStageKey, RaceNightStageData>) {
  return isRaceNightStageStarted(stageSessions.aFeature) ? stageSessions.aFeature : stageSessions.bFeature;
}

function buildRaceNightStageSessions(
  raceNight: Partial<RaceNight>,
): Record<RaceNightStageKey, RaceNightStageData> {
  if (raceNight.stageSessions) {
    return {
      hotLaps: normalizeRaceNightStageData(raceNight.stageSessions.hotLaps),
      heat: normalizeRaceNightStageData(raceNight.stageSessions.heat),
      bFeature: normalizeRaceNightStageData(raceNight.stageSessions.bFeature),
      aFeature: normalizeRaceNightStageData(raceNight.stageSessions.aFeature),
    };
  }

  const legacyBase = createLegacyBaseStageData(raceNight);

  return {
    hotLaps: normalizeRaceNightStageData({
      ...legacyBase,
      startPosition: "",
      finishPosition: "",
    }),
    heat: normalizeRaceNightStageData({
      ...legacyBase,
      startPosition: raceNight.heatStartPosition,
      finishPosition: raceNight.heatFinishPosition,
    }),
    bFeature: createEmptyRaceNightStageData(),
    aFeature: normalizeRaceNightStageData({
      ...legacyBase,
      startPosition: raceNight.featureStartPosition,
      finishPosition: raceNight.featureFinishPosition,
    }),
  };
}

function buildSetupAdjustmentsSummary(stage: RaceNightStageData) {
  const labels: string[] = [];

  if (buildChassisBaselineSummary(stage.setupAdjustments.chassis)) labels.push("Chassis");
  if (buildTireBaselineSummary(stage.setupAdjustments.tires)) labels.push("Tires");
  if (Object.values(stage.setupAdjustments.suspension).some((value) => value.trim())) labels.push("Suspension");
  if (Object.values(stage.setupAdjustments.gears).some((value) => value.trim())) labels.push("Gears");
  if (stage.setupAdjustments.notes.trim()) labels.push("Notes");

  return labels.length ? labels.join(", ") : "";
}

function formatLapDuration(durationMs: number) {
  return (durationMs / 1000).toFixed(3);
}

function buildLapTimesSummary(stage: RaceNightStageData) {
  if (!stage.lapTimer.entries.length) {
    return "";
  }

  return stage.lapTimer.entries
    .map((entry) => `${entry.caution ? "C" : `L${entry.lapNumber}`} ${formatLapDuration(entry.durationMs)}`)
    .join(" | ");
}

function syncRaceNightSummaryFields(raceNight: RaceNight): RaceNight {
  const hotLaps = raceNight.stageSessions.hotLaps;
  const heat = raceNight.stageSessions.heat;
  const featureStage = getDisplayFeatureStage(raceNight.stageSessions);
  const featureSetupSummary = buildSetupAdjustmentsSummary(featureStage);
  const heatSetupSummary = buildSetupAdjustmentsSummary(heat);
  const hotLapsSetupSummary = buildSetupAdjustmentsSummary(hotLaps);
  const featureLapSummary = buildLapTimesSummary(featureStage);
  const heatLapSummary = buildLapTimesSummary(heat);
  const hotLapsLapSummary = buildLapTimesSummary(hotLaps);

  return {
    ...raceNight,
    weatherTemperature: hotLaps.weatherTemperature,
    humidity: hotLaps.humidity,
    windCondition: hotLaps.windCondition,
    skyCondition: hotLaps.skyCondition,
    precipitation: hotLaps.precipitation,
    weatherNotes: hotLaps.weatherNotes,
    trackTemperature: hotLaps.trackTemperature,
    trackType: hotLaps.trackType,
    trackBanking: hotLaps.trackBanking,
    trackLength: hotLaps.trackLength,
    trackSurface: hotLaps.trackSurface,
    moistureState: hotLaps.moistureState,
    trackNotes: hotLaps.trackNotes,
    heatStartPosition: heat.startPosition,
    heatFinishPosition: heat.finishPosition,
    featureStartPosition: featureStage.startPosition,
    featureFinishPosition: featureStage.finishPosition,
    setupChanges:
      featureSetupSummary ||
      featureStage.setupChanges ||
      heatSetupSummary ||
      heat.setupChanges ||
      hotLapsSetupSummary ||
      hotLaps.setupChanges,
    driverNotes: featureStage.driverNotes || heat.driverNotes || hotLaps.driverNotes,
    crewNotes: featureStage.crewNotes || heat.crewNotes || hotLaps.crewNotes,
    lapTimes:
      featureLapSummary ||
      featureStage.lapTimes ||
      heatLapSummary ||
      heat.lapTimes ||
      hotLapsLapSummary ||
      hotLaps.lapTimes,
    checklistSections: cloneChecklistSections(hotLaps.checklistSections),
  };
}

function normalizeRaceNightRecord(raceNight: RaceNight): RaceNight {
  const normalizedVehicleSelections = normalizeTeamVehicleSelections(
    raceNight.racingType,
    raceNight.raceCarType,
    raceNight.carClass,
  );

  const nextRaceNight: RaceNight = {
    ...raceNight,
    racingType: normalizedVehicleSelections.trackType,
    raceCarType: normalizedVehicleSelections.racingType,
    carClass: normalizedVehicleSelections.carClass,
    lastViewedStage:
      raceNight.lastViewedStage && raceNightStageOrder.includes(raceNight.lastViewedStage)
        ? raceNight.lastViewedStage
        : "hotLaps",
    stageSessions: buildRaceNightStageSessions(raceNight),
  };

  return syncRaceNightSummaryFields(backfillTrackMetadataFromBuiltInTrack(nextRaceNight));
}

type CreateAccountResult = {
  needsEmailConfirmation: boolean;
};

type InviteMemberResult = {
  emailSent: boolean;
  inviteLink?: string;
  warning?: string;
};

type TeamStateSnapshot = Pick<
  AppState,
  | "userId"
  | "teamId"
  | "teamName"
  | "userName"
  | "userEmail"
  | "currentTeamRole"
  | "driverName"
  | "crewChiefName"
  | "racingType"
  | "raceCarType"
  | "carClass"
  | "engineType"
  | "fuelType"
  | "carburetorType"
  | "isTeamOwner"
  | "teamMembers"
  | "pendingInvites"
>;

async function persistAuthSnapshot(snapshot: TeamStateSnapshot) {
  await AsyncStorage.setItem(STORAGE_KEYS.authSnapshot, JSON.stringify(snapshot));
}

async function clearAuthSnapshot() {
  await AsyncStorage.removeItem(STORAGE_KEYS.authSnapshot);
}

type AppState = {
  isHydrated: boolean;
  hasSeenOnboarding: boolean;
  hasSeenHomeTutorial: boolean;
  isReplayingHomeTutorial: boolean;
  hasExistingLoginProfile: boolean;
  shouldOpenSettingsAfterTeamCreate: boolean;
  isPasswordRecovery: boolean;
  inviteLinkEmail?: string;
  inviteLinkToken?: string;
  inviteLinkTeamName?: string;
  userId?: string;
  teamId?: string;
  teamName?: string;
  userName?: string;
  userEmail?: string;
  currentTeamRole?: TeamRole;
  driverName?: string;
  crewChiefName?: string;
  racingType?: string;
  raceCarType?: string;
  carClass?: string;
  engineType?: string;
  fuelType?: string;
  carburetorType?: string;
  isTeamOwner: boolean;
  teamMembers: TeamMember[];
  pendingInvites: PendingInvite[];
  chassisSetup: ChassisSetup;
  tireSetup: TireSetup;
  suspensionSetup: SuspensionSetup;
  tireInventory: TireInventoryItem[];
  gearInventory: GearInventoryItem[];
  savedTracks: SavedTrack[];
  raceEvents: RaceEvent[];
  raceNights: RaceNight[];
  brandingPreferences: BrandingPreferences;
  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  completeHomeTutorial: () => Promise<void>;
  replayHomeTutorial: () => Promise<void>;
  consumeSettingsRedirect: () => void;
  handleAuthRedirect: (url: string) => Promise<void>;
  refreshTeamData: () => Promise<void>;
  refreshRaceNight: (raceNightId: string) => Promise<void>;
  createAccount: (input: {
    teamName: string;
    userName: string;
    email: string;
    password: string;
  }) => Promise<CreateAccountResult>;
  logIn: (input: { email: string; password: string }) => Promise<boolean>;
  acceptInvite: (input: {
      email: string;
      phoneNumber: string;
      userName: string;
      password: string;
      token?: string;
    }) => Promise<boolean>;
  saveProfile: (
    teamName?: string,
    userName?: string,
    racingType?: string,
    raceCarType?: string,
    carClass?: string,
    driverName?: string,
    crewChiefName?: string,
    engineType?: string,
    fuelType?: string,
    carburetorType?: string,
  ) => Promise<void>;
  saveBrandingPreferences: (input: Partial<BrandingPreferences>) => Promise<void>;
  inviteMember: (input: {
      email: string;
      deliveryMethod: "email" | "text";
      role: TeamRole;
    }) => Promise<InviteMemberResult>;
  updateTeamMemberRole: (memberId: string, role: TeamRole) => Promise<void>;
    deletePendingInvite: (inviteId: string) => Promise<void>;
    requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  saveChassisSetup: (setup: ChassisSetup) => Promise<void>;
  saveTireSetup: (setup: TireSetup) => Promise<void>;
  saveSuspensionSetup: (setup: SuspensionSetup) => Promise<void>;
  addSavedTrack: (input: {
    name: string;
    trackType: string;
    banking: SavedTrack["banking"];
    length: string;
    notes: string;
  }) => Promise<void>;
  deleteSavedTrack: (trackId: string) => Promise<void>;
  addTireInventoryItem: (input: {
    label: string;
    position: string;
    circumference: string;
    pressure: string;
    notes: string;
  }) => Promise<void>;
  deleteTireInventoryItem: (tireId: string) => Promise<void>;
  addGearInventoryItem: (input: {
    label: string;
    ringTeeth: string;
    pinionTeeth: string;
    quickChangeTopTeeth: string;
    quickChangeBottomTeeth: string;
    notes: string;
  }) => Promise<void>;
  deleteGearInventoryItem: (gearId: string) => Promise<void>;
  createRaceEvent: (input: { title: string; trackName: string; eventDate: string }) => Promise<void>;
  updateRaceEventTitle: (eventId: string, title: string) => Promise<void>;
  deleteRaceEvent: (eventId: string) => Promise<void>;
  startRaceNight: (
    eventId: string,
    options?: { allowWithOtherActive?: boolean; completeOtherActive?: boolean },
  ) => Promise<string>;
  getActiveRaceNightIdForEvent: (eventId: string) => string | undefined;
  saveRaceNight: (raceNightId: string, updates: Partial<RaceNight>) => Promise<void>;
  deleteRaceNight: (raceNightId: string) => Promise<void>;
  clearInviteLink: () => void;
  signOut: () => Promise<void>;
};

type MembershipRow = {
  team_id: string;
  role: TeamRole;
  full_name: string | null;
  email: string;
  teams: {
    id: string;
    name: string;
    owner_user_id: string;
    driver_name: string | null;
    crew_chief_name: string | null;
    racing_type: string | null;
    race_car_type: string | null;
    car_class: string | null;
    engine_type: string | null;
    fuel_type: string | null;
    carburetor_type: string | null;
  } | null;
};

type LegacyMembershipRow = {
  team_id: string;
  role: TeamRole;
  full_name: string | null;
  email: string;
  teams: {
    id: string;
    name: string;
    owner_user_id: string;
    driver_name?: string | null;
    crew_chief_name?: string | null;
    racing_type?: string | null;
    race_car_type?: string | null;
    car_class?: string | null;
    engine_type?: string | null;
    fuel_type?: string | null;
    carburetor_type?: string | null;
  } | null;
};

type TeamMemberRow = {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  role: TeamRole;
  status: "active";
};

type InviteRow = {
  id: string;
  email: string;
  created_at: string;
  status: "pending";
};

type RaceEventRow = {
  id: string;
  title: string;
  track_name: string;
  event_date: string;
  created_at: string;
};

type RaceNightRow = {
  id: string;
  event_id: string;
  event_title: string;
  track_name: string;
  event_date: string;
  status: RaceNight["status"];
  created_at: string;
  updated_at: string;
  payload: RaceNight | null;
};

let activeRaceNightSyncTeamId: string | undefined;
let raceNightSyncInterval: ReturnType<typeof setInterval> | null = null;

function requireSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to your .env file.",
    );
  }
}

async function persistOnboardingFlag(hasSeenOnboarding: boolean) {
  if (hasSeenOnboarding) {
    await AsyncStorage.setItem(STORAGE_KEYS.hasSeenOnboarding, "true");
    return;
  }

  await AsyncStorage.removeItem(STORAGE_KEYS.hasSeenOnboarding);
}

async function persistHomeTutorialFlag(hasSeenHomeTutorial: boolean) {
  if (hasSeenHomeTutorial) {
    await AsyncStorage.setItem(STORAGE_KEYS.hasSeenHomeTutorial, "true");
    return;
  }

  await AsyncStorage.removeItem(STORAGE_KEYS.hasSeenHomeTutorial);
}

async function persistExistingLoginProfileFlag(hasExistingLoginProfile: boolean) {
  if (hasExistingLoginProfile) {
    await AsyncStorage.setItem(STORAGE_KEYS.hasExistingLoginProfile, "true");
    return;
  }

  await AsyncStorage.removeItem(STORAGE_KEYS.hasExistingLoginProfile);
}

async function loadChassisSetup() {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEYS.chassisSetup);

  if (!rawValue) {
    return emptyChassisSetup;
  }

  try {
    return {
      ...emptyChassisSetup,
      ...(JSON.parse(rawValue) as Partial<ChassisSetup>),
    };
  } catch {
    return emptyChassisSetup;
  }
}

async function loadTireSetup() {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEYS.tireSetup);
  try {
    const parsedTireSetup = rawValue ? (JSON.parse(rawValue) as Partial<TireSetup>) : {};
    const legacyChassisRawValue = await AsyncStorage.getItem(STORAGE_KEYS.chassisSetup);
    const legacyChassisSetup = legacyChassisRawValue
      ? (JSON.parse(legacyChassisRawValue) as Record<string, unknown>)
      : {};

    return {
      ...emptyTireSetup,
      ...parsedTireSetup,
      lfWheelOffset:
        parsedTireSetup.lfWheelOffset ??
        (typeof legacyChassisSetup["wheelOffsetLf"] === "string" ? legacyChassisSetup["wheelOffsetLf"] : ""),
      rfWheelOffset:
        parsedTireSetup.rfWheelOffset ??
        (typeof legacyChassisSetup["wheelOffsetRf"] === "string" ? legacyChassisSetup["wheelOffsetRf"] : ""),
      lrWheelOffset:
        parsedTireSetup.lrWheelOffset ??
        (typeof legacyChassisSetup["wheelOffsetLr"] === "string" ? legacyChassisSetup["wheelOffsetLr"] : ""),
      rrWheelOffset:
        parsedTireSetup.rrWheelOffset ??
        (typeof legacyChassisSetup["wheelOffsetRr"] === "string" ? legacyChassisSetup["wheelOffsetRr"] : ""),
    };
  } catch {
    return emptyTireSetup;
  }
}

async function loadSuspensionSetup() {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEYS.suspensionSetup);

  if (!rawValue) {
    return emptySuspensionSetup;
  }

  try {
    return {
      ...emptySuspensionSetup,
      ...(JSON.parse(rawValue) as Partial<SuspensionSetup>),
    };
  } catch {
    return emptySuspensionSetup;
  }
}

async function loadStoredJson<T>(key: string, fallbackValue: T) {
  const rawValue = await AsyncStorage.getItem(key);

  if (!rawValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallbackValue;
  }
}

async function getAuthUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session?.access_token;
}

function isMissingTeamDefaultsColumnError(message?: string) {
  if (!message) {
    return false;
  }

  return (
    message.includes("racing_type") ||
    message.includes("race_car_type") ||
    message.includes("car_class") ||
    message.includes("engine_type") ||
    message.includes("fuel_type") ||
    message.includes("carburetor_type") ||
    message.includes("Could not find the") ||
    message.includes("column")
  );
}

function isMissingRaceEventsTableError(message?: string) {
  if (!message) {
    return false;
  }

  return (
    message.includes("race_events") ||
    message.includes("Could not find the table") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
}

function isMissingRaceNightsTableError(message?: string) {
  if (!message) {
    return false;
  }

  return (
    message.includes("race_nights") ||
    message.includes("Could not find the table") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
}

function isSupabaseAuthSessionError(message?: string) {
  if (!message) {
    return false;
  }

  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("auth session") ||
    normalizedMessage.includes("invalid refresh token") ||
    normalizedMessage.includes("refresh token") ||
    normalizedMessage.includes("jwt") ||
    normalizedMessage.includes("auth session missing") ||
    normalizedMessage.includes("session not found") ||
    normalizedMessage.includes("no authenticated user found")
  );
}

async function loadRaceEventsForTeam(teamId: string) {
  const { data, error } = await supabase
    .from("race_events")
    .select("id, title, track_name, event_date, created_at")
    .eq("team_id", teamId)
    .order("event_date", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<RaceEventRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((event) => ({
    id: event.id,
    title: event.title,
    trackName: event.track_name,
    eventDate: formatStoredDateValue(event.event_date),
    createdAt: event.created_at,
  }));
}

function mapRaceNightRowToRecord(row: RaceNightRow): RaceNight {
  const payload = row.payload ? normalizeRaceNightRecord(row.payload) : undefined;

  return normalizeRaceNightRecord({
    ...(payload ?? ({} as RaceNight)),
    id: row.id,
    eventId: row.event_id,
    eventTitle: row.event_title,
    trackName: row.track_name,
    eventDate: formatStoredDateValue(row.event_date),
    status: row.status,
    createdAt: row.created_at,
  } as RaceNight);
}

async function persistRaceNightsLocally(raceNights: RaceNight[]) {
  await AsyncStorage.setItem(STORAGE_KEYS.raceNights, JSON.stringify(raceNights));
}

async function loadRaceNightsForTeam(teamId: string) {
  const { data, error } = await supabase
    .from("race_nights")
    .select("id, event_id, event_title, track_name, event_date, status, created_at, updated_at, payload")
    .eq("team_id", teamId)
    .order("event_date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<RaceNightRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapRaceNightRowToRecord);
}

async function loadRaceNightForTeam(teamId: string, raceNightId: string) {
  const { data, error } = await supabase
    .from("race_nights")
    .select("id, event_id, event_title, track_name, event_date, status, created_at, updated_at, payload")
    .eq("team_id", teamId)
    .eq("id", raceNightId)
    .maybeSingle<RaceNightRow>();

  if (error) {
    throw error;
  }

  return data ? mapRaceNightRowToRecord(data) : undefined;
}

async function upsertRaceNightForTeam(teamId: string, raceNight: RaceNight) {
  const user = await getAuthUser();

  if (!user?.id) {
    throw new Error("No authenticated user found.");
  }

  const normalizedRaceNight = normalizeRaceNightRecord(raceNight);
  const payload = JSON.parse(JSON.stringify(normalizedRaceNight)) as RaceNight;

  const { error } = await supabase.from("race_nights").upsert(
    {
      id: normalizedRaceNight.id,
      team_id: teamId,
      event_id: normalizedRaceNight.eventId,
      event_title: normalizedRaceNight.eventTitle,
      track_name: normalizedRaceNight.trackName,
      event_date: formatStoredDateValue(normalizedRaceNight.eventDate),
      status: normalizedRaceNight.status,
      created_by_user_id: user.id,
      created_at: normalizedRaceNight.createdAt,
      updated_at: new Date().toISOString(),
      payload,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

async function seedRaceNightsForTeam(teamId: string, raceNights: RaceNight[]) {
  if (raceNights.length === 0) {
    return;
  }

  for (const raceNight of raceNights.map(normalizeRaceNightRecord)) {
    await upsertRaceNightForTeam(teamId, raceNight);
  }
}

async function mergeMissingLocalRaceNightsForTeam(teamId: string, localRaceNights: RaceNight[]) {
  const remoteRaceNights = await loadRaceNightsForTeam(teamId);

  if (localRaceNights.length === 0) {
    return remoteRaceNights;
  }

  const localRaceNightMap = new Map(
    localRaceNights.map((raceNight) => [raceNight.id, normalizeRaceNightRecord(raceNight)]),
  );
  const mergedRemoteRaceNights = remoteRaceNights.map((remoteRaceNight) => {
    const localRaceNight = localRaceNightMap.get(remoteRaceNight.id);

    return localRaceNight ? mergeRaceNightChecklistForSync(localRaceNight, remoteRaceNight) : remoteRaceNight;
  });
  const changedMergedRaceNights = mergedRemoteRaceNights.filter((mergedRaceNight) => {
    const originalRemoteRaceNight = remoteRaceNights.find((raceNight) => raceNight.id === mergedRaceNight.id);

    return originalRemoteRaceNight && JSON.stringify(originalRemoteRaceNight) !== JSON.stringify(mergedRaceNight);
  });

  if (changedMergedRaceNights.length > 0) {
    await seedRaceNightsForTeam(teamId, changedMergedRaceNights);
  }

  return changedMergedRaceNights.length > 0
    ? loadRaceNightsForTeam(teamId)
    : mergedRemoteRaceNights;
}

async function resolveRaceNightsForTeam(teamId: string, localRaceNights: RaceNight[]) {
  try {
    return mergeMissingLocalRaceNightsForTeam(teamId, localRaceNights);
  } catch (error) {
    if (!(error instanceof Error) || !isMissingRaceNightsTableError(error.message)) {
      console.warn("Unable to load shared race nights. Falling back to local race nights.", error);
    }
    return localRaceNights.map(normalizeRaceNightRecord);
  }
}

async function syncRaceNightsForCurrentTeam(teamId: string) {
  const localRaceNights = useAppStore.getState().raceNights;
  const nextRaceNights = await resolveRaceNightsForTeam(teamId, localRaceNights);
  await persistRaceNightsLocally(nextRaceNights);
  useAppStore.setState({ raceNights: nextRaceNights });
}

function stopRaceNightSyncLoop() {
  activeRaceNightSyncTeamId = undefined;

  if (raceNightSyncInterval) {
    clearInterval(raceNightSyncInterval);
    raceNightSyncInterval = null;
  }
}

function startRaceNightSyncLoop(teamId?: string) {
  if (!teamId || !isSupabaseConfigured) {
    stopRaceNightSyncLoop();
    return;
  }

  if (raceNightSyncInterval && activeRaceNightSyncTeamId === teamId) {
    return;
  }

  stopRaceNightSyncLoop();
  activeRaceNightSyncTeamId = teamId;
  raceNightSyncInterval = setInterval(() => {
    void syncRaceNightsForCurrentTeam(teamId).catch((error) => {
      console.warn("Unable to refresh shared race nights.", error);
    });
  }, 5000);
}

function buildRaceEventSyncKey(event: Pick<RaceEvent, "title" | "trackName" | "eventDate">) {
  return [
    event.title.trim().toLowerCase(),
    event.trackName.trim().toLowerCase(),
    formatStoredDateValue(event.eventDate),
  ].join("::");
}

async function seedRaceEventsForTeam(teamId: string, raceEvents: RaceEvent[]) {
  const user = await getAuthUser();

  if (!user?.id || raceEvents.length === 0) {
    return;
  }

  const { error } = await supabase.from("race_events").insert(
    raceEvents.map((event) => ({
      team_id: teamId,
      title: event.title,
      track_name: event.trackName,
      event_date: formatStoredDateValue(event.eventDate),
      created_by_user_id: user.id,
    })),
  );

  if (error) {
    throw error;
  }
}

async function mergeMissingLocalRaceEventsForTeam(teamId: string, localRaceEvents: RaceEvent[]) {
  const remoteRaceEvents = await loadRaceEventsForTeam(teamId);
  return loadRaceEventsForTeam(teamId);
}

async function resolveRaceEventsForTeam(teamId: string, localRaceEvents: RaceEvent[]) {
  try {
    return loadRaceEventsForTeam(teamId);
  } catch (error) {
    if (!(error instanceof Error) || !isMissingRaceEventsTableError(error.message)) {
      console.warn("Unable to load shared race events. Falling back to local events.", error);
    }
    return localRaceEvents;
  }
}

async function loadFreshRaceEventsForTeam(teamId: string) {
  try {
    return await loadRaceEventsForTeam(teamId);
  } catch (error) {
    if (!(error instanceof Error) || !isMissingRaceEventsTableError(error.message)) {
      console.warn("Unable to load shared race events for a new team. Starting empty.", error);
    }
    return [] as RaceEvent[];
  }
}

async function loadFreshRaceNightsForTeam(teamId: string) {
  try {
    return await loadRaceNightsForTeam(teamId);
  } catch (error) {
    if (!(error instanceof Error) || !isMissingRaceNightsTableError(error.message)) {
      console.warn("Unable to load shared race nights for a new team. Starting empty.", error);
    }
    return [] as RaceNight[];
  }
}

async function refreshTeamDataForCurrentUser(preferredTeamId?: string): Promise<TeamStateSnapshot> {
  const user = await getAuthUser();

  if (!user?.id || !user.email) {
    return {
      userId: undefined,
      teamId: undefined,
      teamName: undefined,
      userName: undefined,
      userEmail: undefined,
      currentTeamRole: undefined,
      driverName: undefined,
      crewChiefName: undefined,
      racingType: undefined,
      raceCarType: undefined,
      carClass: undefined,
      engineType: undefined,
      fuelType: undefined,
      carburetorType: undefined,
      isTeamOwner: false,
      teamMembers: [] as TeamMember[],
      pendingInvites: [] as PendingInvite[],
    };
  }

  let membershipData: MembershipRow | LegacyMembershipRow | null = null;

  let membershipQuery = supabase
    .from("team_members")
    .select("team_id, role, full_name, email, teams(id, name, owner_user_id, driver_name, crew_chief_name, racing_type, race_car_type, car_class, engine_type, fuel_type, carburetor_type)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  if (preferredTeamId) {
    membershipQuery = membershipQuery.eq("team_id", preferredTeamId);
  }

  const {
    data: nextMembershipData,
    error: membershipError,
  } = await membershipQuery.maybeSingle<MembershipRow>();

  if (membershipError) {
    if (!isMissingTeamDefaultsColumnError(membershipError.message)) {
      throw membershipError;
    }

    let legacyMembershipQuery = supabase
      .from("team_members")
      .select("team_id, role, full_name, email, teams(id, name, owner_user_id)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1);

    if (preferredTeamId) {
      legacyMembershipQuery = legacyMembershipQuery.eq("team_id", preferredTeamId);
    }

    const { data: legacyMembershipData, error: legacyMembershipError } =
      await legacyMembershipQuery.maybeSingle<LegacyMembershipRow>();

    if (legacyMembershipError) {
      throw legacyMembershipError;
    }

    membershipData = legacyMembershipData;
  } else {
    membershipData = nextMembershipData;
  }

  if (!membershipData?.teams) {
    return {
      userId: user.id,
      teamId: undefined,
      teamName:
        typeof user.user_metadata?.team_name === "string" ? user.user_metadata.team_name : undefined,
      userName:
        membershipData?.full_name ||
        (typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : undefined),
      userEmail: user.email,
      currentTeamRole: membershipData?.role,
      driverName: undefined,
      crewChiefName: undefined,
      racingType: undefined,
      raceCarType: undefined,
      carClass: undefined,
      engineType: undefined,
      fuelType: undefined,
      carburetorType: undefined,
      isTeamOwner: false,
      teamMembers: [] as TeamMember[],
      pendingInvites: [] as PendingInvite[],
    };
  }

  const teamId = membershipData.team_id;
  const membershipTeam = membershipData.teams;
  const ownerUserId = membershipTeam.owner_user_id;

  if (ownerUserId === user.id && membershipData.role !== "Owner") {
    const { error: ownerRoleSyncError } = await supabase
      .from("team_members")
      .update({
        role: "Owner",
      })
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .eq("status", "active");

    if (!ownerRoleSyncError) {
      membershipData = {
        ...membershipData,
        role: "Owner",
      };
    } else {
      console.warn("Unable to restore owner role on team member record.", ownerRoleSyncError);
    }
  }

  const [membersResponse, invitesResponse] = await Promise.all([
    supabase
      .from("team_members")
      .select("id, user_id, email, full_name, role, status")
      .eq("team_id", teamId)
      .eq("status", "active")
      .returns<TeamMemberRow[]>(),
    supabase
      .from("invites")
      .select("id, email, role, created_at, status")
      .eq("team_id", teamId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .returns<InviteRow[]>(),
  ]);

  if (membersResponse.error) {
    throw membersResponse.error;
  }

  if (invitesResponse.error) {
    throw invitesResponse.error;
  }

  const normalizedVehicleSelections = normalizeTeamVehicleSelections(
    "racing_type" in membershipTeam ? membershipTeam.racing_type || undefined : undefined,
    "race_car_type" in membershipTeam ? membershipTeam.race_car_type || undefined : undefined,
    "car_class" in membershipTeam ? membershipTeam.car_class || undefined : undefined,
  );

  return {
    userId: user.id,
    teamId,
    teamName: membershipTeam.name,
    userName:
      membershipData.full_name ||
      (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined),
    userEmail: user.email,
    currentTeamRole: ownerUserId === user.id ? "Owner" : membershipData.role,
    driverName:
      "driver_name" in membershipTeam ? membershipTeam.driver_name || undefined : undefined,
    crewChiefName:
      "crew_chief_name" in membershipTeam ? membershipTeam.crew_chief_name || undefined : undefined,
    racingType: normalizedVehicleSelections.trackType,
    raceCarType: normalizedVehicleSelections.racingType,
    carClass: normalizedVehicleSelections.carClass,
    engineType: "engine_type" in membershipTeam ? membershipTeam.engine_type || undefined : undefined,
    fuelType: "fuel_type" in membershipTeam ? membershipTeam.fuel_type || undefined : undefined,
    carburetorType:
      "carburetor_type" in membershipTeam ? membershipTeam.carburetor_type || undefined : undefined,
    isTeamOwner: ownerUserId === user.id,
    teamMembers: sortTeamMembers(
      (membersResponse.data ?? []).map((member) => ({
        id: member.id,
        userId: member.user_id ?? undefined,
        email: member.email,
        name: member.full_name || member.email,
        role: member.user_id === ownerUserId ? "Owner" : member.role,
        status: member.status,
      })),
    ),
    pendingInvites: (invitesResponse.data ?? []).map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: normalizeTeamRole(invite.role || "Crew"),
      invitedAt: invite.created_at,
      status: invite.status,
    })),
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  isHydrated: false,
  hasSeenOnboarding: false,
  hasSeenHomeTutorial: false,
  isReplayingHomeTutorial: false,
  hasExistingLoginProfile: false,
  shouldOpenSettingsAfterTeamCreate: false,
  isPasswordRecovery: false,
  inviteLinkEmail: undefined,
  inviteLinkToken: undefined,
  inviteLinkTeamName: undefined,
  userId: undefined,
  teamId: undefined,
  teamName: undefined,
  userName: undefined,
  userEmail: undefined,
  currentTeamRole: undefined,
  driverName: undefined,
  crewChiefName: undefined,
  racingType: undefined,
  raceCarType: undefined,
  carClass: undefined,
  engineType: undefined,
  fuelType: undefined,
  carburetorType: undefined,
  isTeamOwner: false,
  teamMembers: [],
  pendingInvites: [],
  chassisSetup: emptyChassisSetup,
  tireSetup: emptyTireSetup,
  suspensionSetup: emptySuspensionSetup,
  brandingPreferences: defaultBrandingPreferences,
  tireInventory: emptyTireInventory,
  gearInventory: emptyGearInventory,
  savedTracks: emptySavedTracks,
  raceEvents: emptyRaceEvents,
  raceNights: emptyRaceNights,
    hydrate: async () => {
      const hasSeenOnboarding =
        (await AsyncStorage.getItem(STORAGE_KEYS.hasSeenOnboarding)) === "true";
      const hasSeenHomeTutorial =
        (await AsyncStorage.getItem(STORAGE_KEYS.hasSeenHomeTutorial)) === "true";
      const hasExistingLoginProfile =
        (await AsyncStorage.getItem(STORAGE_KEYS.hasExistingLoginProfile)) === "true";
    const chassisSetup = await loadChassisSetup();
    const tireSetup = await loadTireSetup();
    const suspensionSetup = await loadSuspensionSetup();
    const tireInventory = await loadStoredJson<TireInventoryItem[]>(
      STORAGE_KEYS.tireInventory,
      emptyTireInventory,
    );
    const brandingPreferences = await loadStoredJson<BrandingPreferences>(
      STORAGE_KEYS.brandingPreferences,
      defaultBrandingPreferences,
    );
    const gearInventory = await loadStoredJson<GearInventoryItem[]>(
      STORAGE_KEYS.gearInventory,
      emptyGearInventory,
    );
    const savedTracks = await loadStoredJson<SavedTrack[]>(STORAGE_KEYS.savedTracks, emptySavedTracks);
    const raceEvents = await loadStoredJson<RaceEvent[]>(STORAGE_KEYS.raceEvents, emptyRaceEvents);
    const storedRaceNights = await loadStoredJson<RaceNight[]>(STORAGE_KEYS.raceNights, emptyRaceNights);
    const raceNights = storedRaceNights.map(normalizeRaceNightRecord);
    const nextState: TeamStateSnapshot = {
      userId: undefined,
      teamId: undefined,
      teamName: undefined,
      userName: undefined,
      userEmail: undefined,
      currentTeamRole: undefined,
      driverName: undefined,
      crewChiefName: undefined,
      racingType: undefined,
      raceCarType: undefined,
      carClass: undefined,
      engineType: undefined,
      fuelType: undefined,
      carburetorType: undefined,
      isTeamOwner: false,
      teamMembers: [] as TeamMember[],
      pendingInvites: [] as PendingInvite[],
    };
    const cachedAuthSnapshot = await loadStoredJson<TeamStateSnapshot>(
      STORAGE_KEYS.authSnapshot,
      nextState,
    );
    let hasStoredSupabaseSession = false;

    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase.auth.getSession();
        hasStoredSupabaseSession = !!data.session?.user;
      } catch (error) {
        console.warn("Unable to read saved Supabase session during startup.", error);
      }
    }

    set({
        isHydrated: true,
        hasSeenOnboarding,
        hasSeenHomeTutorial,
        hasExistingLoginProfile,
        isPasswordRecovery: false,
        inviteLinkEmail: undefined,
        inviteLinkToken: undefined,
        inviteLinkTeamName: undefined,
      chassisSetup,
      tireSetup,
      suspensionSetup,
      brandingPreferences: {
        ...defaultBrandingPreferences,
        ...brandingPreferences,
      },
      tireInventory,
      gearInventory,
      savedTracks,
      raceEvents,
      raceNights,
      ...(hasStoredSupabaseSession ? cachedAuthSnapshot : nextState),
    });

    if (!isSupabaseConfigured) {
      return;
    }

    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();

        if (!data.session?.user) {
          await clearAuthSnapshot();
          stopRaceNightSyncLoop();
          return;
        }

        const remoteState = await refreshTeamDataForCurrentUser();
        let syncedRaceEvents = raceEvents;
        let syncedRaceNights = raceNights;
        const previousTeamId = hasStoredSupabaseSession ? cachedAuthSnapshot.teamId : undefined;
        const isSameTeam = !!remoteState.teamId && remoteState.teamId === previousTeamId;

        if (remoteState.teamId) {
          syncedRaceEvents = isSameTeam
            ? await resolveRaceEventsForTeam(remoteState.teamId, raceEvents)
            : await loadFreshRaceEventsForTeam(remoteState.teamId);
          syncedRaceNights = isSameTeam
            ? await resolveRaceNightsForTeam(remoteState.teamId, raceNights)
            : await loadFreshRaceNightsForTeam(remoteState.teamId);
          startRaceNightSyncLoop(remoteState.teamId);
        } else {
          stopRaceNightSyncLoop();
        }

        await AsyncStorage.setItem(STORAGE_KEYS.raceEvents, JSON.stringify(syncedRaceEvents));
        await persistRaceNightsLocally(syncedRaceNights);
        await persistAuthSnapshot(remoteState);
        set({
          ...remoteState,
          raceEvents: syncedRaceEvents,
          raceNights: syncedRaceNights,
        });
      } catch (error) {
        console.warn("Hydration hit a remote sync issue. Continuing with local startup state.", error);
      }
    })();
  },
  completeOnboarding: async () => {
    await persistOnboardingFlag(true);
    set({ hasSeenOnboarding: true });
  },
  completeHomeTutorial: async () => {
    await persistHomeTutorialFlag(true);
    set({ hasSeenHomeTutorial: true, isReplayingHomeTutorial: false });
  },
    replayHomeTutorial: async () => {
      set({ isReplayingHomeTutorial: true });
    },
    consumeSettingsRedirect: () => {
      set({ shouldOpenSettingsAfterTeamCreate: false });
    },
    handleAuthRedirect: async (url) => {
    requireSupabase();

    if (url.includes("accept-invite")) {
        const queryString = url.includes("?") ? url.slice(url.indexOf("?") + 1).split("#")[0] : "";
        const params = new URLSearchParams(queryString);
        const inviteLinkEmail = params.get("email")?.trim().toLowerCase();
        const inviteLinkToken = params.get("token")?.trim();
        const inviteLinkTeamName = params.get("teamName")?.trim();

        set({
          inviteLinkEmail,
          inviteLinkToken,
          inviteLinkTeamName,
        });
        return;
      }

    const createdSession = await createSessionFromUrl(url);
    if (!createdSession) {
      return;
    }

    if (url.includes("reset-password")) {
      set({ isPasswordRecovery: true });
      return;
    }

    await get().refreshTeamData();
  },
  refreshTeamData: async () => {
    requireSupabase();
    const nextState = await refreshTeamDataForCurrentUser();
    let nextRaceEvents = get().raceEvents;
    let nextRaceNights = get().raceNights;
    const previousTeamId = get().teamId;
    const isSameTeam = !!nextState.teamId && nextState.teamId === previousTeamId;

    if (nextState.teamId) {
      nextRaceEvents = isSameTeam
        ? await resolveRaceEventsForTeam(nextState.teamId, nextRaceEvents)
        : await loadFreshRaceEventsForTeam(nextState.teamId);
      nextRaceNights = isSameTeam
        ? await resolveRaceNightsForTeam(nextState.teamId, nextRaceNights)
        : await loadFreshRaceNightsForTeam(nextState.teamId);
      startRaceNightSyncLoop(nextState.teamId);
    } else {
      stopRaceNightSyncLoop();
    }

    await AsyncStorage.setItem(STORAGE_KEYS.raceEvents, JSON.stringify(nextRaceEvents));
    await persistRaceNightsLocally(nextRaceNights);
    await persistAuthSnapshot(nextState);
    set({
      ...nextState,
      raceEvents: nextRaceEvents,
      raceNights: nextRaceNights,
    });
  },
  createAccount: async ({ teamName, userName, email, password }) => {
    requireSupabase();

    const ownerName = userName.trim() || "Team Owner";
    const trimmedTeamName = teamName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const passwordMessage = getPasswordValidationMessage(password);

    if (passwordMessage) {
      throw new Error(passwordMessage);
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          full_name: ownerName,
          team_name: trimmedTeamName,
        },
      },
    });

    if (error) {
      if (error.message?.toLowerCase().includes("role")) {
        throw new Error(
          "The invite role field is not in Supabase yet. Run the latest invites SQL update to add the role column, then try sending the invite again.",
        );
      }
      throw error;
    }

    const authUser = data.user;
    const needsEmailConfirmation = !data.session;

    if (!authUser?.id || needsEmailConfirmation) {
      return { needsEmailConfirmation };
    }

    const { data: teamInsert, error: teamError } = await supabase
      .from("teams")
      .insert({
        name: trimmedTeamName,
        owner_user_id: authUser.id,
      })
      .select("id, name")
      .single<{ id: string; name: string }>();

    if (teamError) {
      throw teamError;
    }

    const { error: memberError } = await supabase.from("team_members").insert({
      team_id: teamInsert.id,
      user_id: authUser.id,
      email: trimmedEmail,
      full_name: ownerName,
      role: "Owner",
      status: "active",
    });

      if (memberError) {
        throw memberError;
      }

      await persistExistingLoginProfileFlag(true);
      set({
        hasExistingLoginProfile: true,
        shouldOpenSettingsAfterTeamCreate: true,
      });
      const nextState = await refreshTeamDataForCurrentUser(teamInsert.id);
      const nextRaceEvents = await loadFreshRaceEventsForTeam(teamInsert.id);
      const nextRaceNights = await loadFreshRaceNightsForTeam(teamInsert.id);
      startRaceNightSyncLoop(teamInsert.id);
      await AsyncStorage.setItem(STORAGE_KEYS.raceEvents, JSON.stringify(nextRaceEvents));
      await persistRaceNightsLocally(nextRaceNights);
      await persistAuthSnapshot(nextState);
      set({
        ...nextState,
        raceEvents: nextRaceEvents,
        raceNights: nextRaceNights,
      });
      return { needsEmailConfirmation: false };
    },
  logIn: async ({ email, password }) => {
    requireSupabase();

    const trimmedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

      if (error) {
        throw error;
      }

      await persistExistingLoginProfileFlag(true);
      set({ hasExistingLoginProfile: true });
      await get().refreshTeamData();
      return !!get().teamId;
    },
    acceptInvite: async ({ email, phoneNumber, userName, password, token }) => {
      requireSupabase();

      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPhoneNumber = phoneNumber.trim();
      const trimmedName = userName.trim() || "Crew Member";
      const passwordMessage = getPasswordValidationMessage(password);

    const signInAttempt = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (signInAttempt.error) {
      if (passwordMessage) {
        throw new Error(passwordMessage);
      }

        const signUpAttempt = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              full_name: trimmedName,
              phone_number: trimmedPhoneNumber,
            },
          },
        });

      if (signUpAttempt.error) {
        throw signUpAttempt.error;
      }

      if (!signUpAttempt.data.session) {
        throw new Error(
          "Invite account created, but email confirmation is still enabled. Turn off Confirm email or finish the confirmation flow first.",
        );
      }
    }

    const user = await getAuthUser();

    if (!user?.id || !user.email) {
      throw new Error("Could not load the authenticated user after accepting the invite.");
    }

    let inviteQuery = supabase
      .from("invites")
      .select("id, team_id, email, role")
      .eq("email", trimmedEmail)
      .eq("status", "pending");

    if (token) {
      inviteQuery = inviteQuery.eq("token", token);
    }

    const { data: invite, error: inviteError } = await inviteQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; team_id: string; email: string; role?: string | null }>();

    if (inviteError) {
      throw inviteError;
    }

    if (!invite) {
      return false;
    }

    const { error: upsertMemberError } = await supabase.from("team_members").upsert(
      {
        team_id: invite.team_id,
        user_id: user.id,
        email: trimmedEmail,
        full_name: trimmedName,
        role: normalizeTeamRole(invite.role || "Crew"),
        status: "active",
      },
      { onConflict: "team_id,email" },
    );

    if (upsertMemberError) {
      throw upsertMemberError;
    }

    const { error: inviteUpdateError } = await supabase
      .from("invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        accepted_by_user_id: user.id,
      })
      .eq("id", invite.id);

    if (inviteUpdateError) {
      throw inviteUpdateError;
    }

    await supabase.auth.updateUser({
      data: {
        full_name: trimmedName,
        phone_number: trimmedPhoneNumber,
      },
    });

    await persistExistingLoginProfileFlag(true);
    set({ hasExistingLoginProfile: true });
    set({
      inviteLinkEmail: undefined,
      inviteLinkToken: undefined,
      inviteLinkTeamName: undefined,
    });

    const nextState = await refreshTeamDataForCurrentUser(invite.team_id);
    let nextRaceEvents: RaceEvent[] = [];
    let nextRaceNights: RaceNight[] = [];

    if (nextState.teamId) {
      nextRaceEvents = await loadFreshRaceEventsForTeam(nextState.teamId);
      nextRaceNights = await loadFreshRaceNightsForTeam(nextState.teamId);
      startRaceNightSyncLoop(nextState.teamId);
    } else {
      stopRaceNightSyncLoop();
    }

    await AsyncStorage.setItem(STORAGE_KEYS.raceEvents, JSON.stringify(nextRaceEvents));
    await persistRaceNightsLocally(nextRaceNights);
    await persistAuthSnapshot(nextState);
    set({
      ...nextState,
      raceEvents: nextRaceEvents,
      raceNights: nextRaceNights,
    });

    return true;
  },
  saveProfile: async (
    teamName,
    userName,
    racingType,
    raceCarType,
    carClass,
    driverName,
    crewChiefName,
    engineType,
    fuelType,
    carburetorType,
  ) => {
    requireSupabase();

    const user = await getAuthUser();
    const nextUserName = userName?.trim() || undefined;
    const nextDriverName = driverName?.trim() || undefined;
    const nextCrewChiefName = crewChiefName?.trim() || undefined;
    const normalizedVehicleSelections = normalizeTeamVehicleSelections(
      racingType,
      raceCarType,
      carClass,
    );
    const nextRacingType = normalizedVehicleSelections.trackType;
    const nextRaceCarType = normalizedVehicleSelections.racingType;
    const nextCarClass = normalizedVehicleSelections.carClass;
    const nextEngineType = engineType?.trim() || undefined;
    const nextFuelType = fuelType?.trim() || undefined;
    const nextCarburetorType = carburetorType?.trim() || undefined;
    const allowedRaceCarTypes = getRaceCarTypeOptions(nextRaceCarType);
    const resolvedCarClass =
      nextCarClass && allowedRaceCarTypes.includes(nextCarClass) ? nextCarClass : undefined;
    const { teamId, isTeamOwner } = get();

    if (!user?.id) {
      throw new Error("No authenticated user found.");
    }

    if (nextUserName) {
      const { error: memberUpdateError } = await supabase
        .from("team_members")
        .update({ full_name: nextUserName })
        .eq("user_id", user.id);

      if (memberUpdateError) {
        throw memberUpdateError;
      }

      await supabase.auth.updateUser({
        data: {
          full_name: nextUserName,
        },
      });
    }

    if (teamId && isTeamOwner) {
      const { error: teamUpdateError } = await supabase
        .from("teams")
        .update({
          driver_name: nextDriverName ?? null,
          crew_chief_name: nextCrewChiefName ?? null,
          racing_type: nextRacingType ?? null,
          race_car_type: nextRaceCarType ?? null,
          car_class: resolvedCarClass ?? null,
          engine_type: nextEngineType ?? null,
          fuel_type: nextFuelType ?? null,
          carburetor_type: nextCarburetorType ?? null,
        })
        .eq("id", teamId);

      if (teamUpdateError) {
        if (isMissingTeamDefaultsColumnError(teamUpdateError.message)) {
          throw new Error(
            "The team baseline fields are not in Supabase yet. Run the latest SQL update to add the track type, racing type, car class, engine, fuel, and carburetor columns to the teams table, then try Save Changes again.",
          );
        }
        throw teamUpdateError;
      }
    }

    await get().refreshTeamData();
  },
  saveBrandingPreferences: async (input) => {
    const nextPreferences = {
      ...defaultBrandingPreferences,
      ...get().brandingPreferences,
      ...input,
    };

    await AsyncStorage.setItem(
      STORAGE_KEYS.brandingPreferences,
      JSON.stringify(nextPreferences),
    );

    set({
      brandingPreferences: nextPreferences,
    });
  },
    inviteMember: async ({ email, deliveryMethod, role }) => {
        requireSupabase();

        const trimmedEmail = email.trim().toLowerCase();
        const { teamId, teamName } = get();
      const user = await getAuthUser();
      const nextRole = normalizeTeamRole(role);

      if (!trimmedEmail || !teamId || !user?.id) {
        return {
          emailSent: false,
          warning: "Missing team context for invite creation.",
        };
      }

      const [existingMemberResponse, existingInviteResponse] = await Promise.all([
        supabase
          .from("team_members")
          .select("id")
          .eq("team_id", teamId)
          .eq("email", trimmedEmail)
          .eq("status", "active")
          .limit(1),
        supabase
          .from("invites")
          .select("id")
          .eq("team_id", teamId)
          .eq("email", trimmedEmail)
          .eq("status", "pending")
          .limit(1),
      ]);

      if (existingMemberResponse.error) {
        throw existingMemberResponse.error;
      }

      if (existingInviteResponse.error) {
        throw existingInviteResponse.error;
      }

      if ((existingMemberResponse.data ?? []).length > 0) {
        throw new Error("That email is already an active team member.");
      }

      if ((existingInviteResponse.data ?? []).length > 0) {
        throw new Error("A pending invite already exists for that email address.");
      }

      const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const { data: inviteRow, error } = await supabase
        .from("invites")
      .insert({
        team_id: teamId,
        email: trimmedEmail,
        role: nextRole,
        token,
        invited_by_user_id: user.id,
        status: "pending",
      })
      .select("id")
      .single<{ id: string }>();

    if (error) {
      throw error;
    }

      let inviteResult: InviteMemberResult = {
        emailSent: false,
        inviteLink: `precisionpit://accept-invite?email=${encodeURIComponent(trimmedEmail)}&token=${encodeURIComponent(token)}&teamName=${encodeURIComponent(teamName ?? "Team")}`,
        warning:
          "The invite was saved, but the email function is not deployed or not configured yet.",
      };

      if (inviteRow?.id && deliveryMethod === "email") {
        const accessToken = await getAccessToken();
        const functionResponse = await fetch(`${supabaseUrl}/functions/v1/send-team-invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabasePublishableKey,
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
        },
        body: JSON.stringify({
          inviteId: inviteRow.id,
        }),
      });

        if (functionResponse.ok) {
          inviteResult = {
            emailSent: true,
            inviteLink: inviteResult.inviteLink,
          };
        } else {
        let functionErrorMessage = "The invite email function returned an error.";

        try {
          const functionErrorBody = (await functionResponse.json()) as { error?: string };
          if (functionErrorBody?.error) {
            functionErrorMessage = functionErrorBody.error;
          }
        } catch {
          functionErrorMessage = `Edge Function returned HTTP ${functionResponse.status}.`;
        }

          inviteResult = {
            emailSent: false,
            inviteLink: inviteResult.inviteLink,
            warning: functionErrorMessage,
          };
        }
      }

    await get().refreshTeamData();
    return inviteResult;
  },
    updateTeamMemberRole: async (memberId, role) => {
      requireSupabase();

      const trimmedMemberId = memberId.trim();
      const nextRole = normalizeTeamRole(role);
      const { teamId, isTeamOwner, currentTeamRole, teamMembers } = get();

      if (!trimmedMemberId || !teamId) {
        throw new Error("Missing team member details.");
      }

      if (!isTeamOwner) {
        throw new Error("Only the team owner can change team-member roles.");
      }

      const targetMember = teamMembers.find((member) => member.id === trimmedMemberId);
      if (!targetMember) {
        throw new Error("Team member not found.");
      }

      if (targetMember.role === nextRole) {
        return;
      }

      if (nextRole === "Owner") {
        if (!targetMember.userId) {
          throw new Error("This team member must finish joining the team before becoming the owner.");
        }

        const currentOwner = teamMembers.find((member) => member.role === "Owner");

        const { error: promoteMemberError } = await supabase
          .from("team_members")
          .update({
            role: "Owner",
          })
          .eq("id", targetMember.id)
          .eq("team_id", teamId);

        if (promoteMemberError) {
          throw promoteMemberError;
        }

        const { error } = await supabase
          .from("teams")
          .update({
            owner_user_id: targetMember.userId,
          })
          .eq("id", teamId);

        if (error) {
          throw error;
        }

        if (currentOwner && currentOwner.id !== targetMember.id) {
          const { error: demoteOwnerError } = await supabase
            .from("team_members")
            .update({
              role: "Crew",
            })
            .eq("id", currentOwner.id)
            .eq("team_id", teamId);

          if (demoteOwnerError) {
            throw demoteOwnerError;
          }
        }

        await get().refreshTeamData();
        return;
      }

      if (targetMember.role === "Owner") {
        throw new Error("To transfer ownership, choose Owner on another active team member instead.");
      }

      const { error } = await supabase
        .from("team_members")
        .update({
          role: nextRole,
        })
        .eq("id", trimmedMemberId)
        .eq("team_id", teamId);

      if (error) {
        throw error;
      }

      await get().refreshTeamData();
    },
    deletePendingInvite: async (inviteId) => {
      requireSupabase();

      const trimmedInviteId = inviteId.trim();
      const { teamId } = get();
      const user = await getAuthUser();

      if (!trimmedInviteId || !teamId || !user?.id) {
        throw new Error("Missing invite details.");
      }

      const { error } = await supabase
        .from("invites")
        .update({
          status: "revoked",
        })
        .eq("id", trimmedInviteId)
        .eq("team_id", teamId)
        .eq("invited_by_user_id", user.id)
        .eq("status", "pending");

      if (error) {
        throw error;
      }

      await get().refreshTeamData();
    },
    requestPasswordReset: async (email) => {
      requireSupabase();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      throw new Error("Enter your email address first.");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: passwordResetRedirectUrl,
    });

    if (error) {
      throw error;
    }
  },
  updatePassword: async (password) => {
    requireSupabase();

    const passwordMessage = getPasswordValidationMessage(password);
    if (passwordMessage) {
      throw new Error(passwordMessage);
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw error;
    }

    const nextState = await refreshTeamDataForCurrentUser();
    set({
      ...nextState,
      isPasswordRecovery: false,
    });
  },
  saveChassisSetup: async (setup) => {
    const nextSetup = {
      ...emptyChassisSetup,
      ...setup,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.chassisSetup, JSON.stringify(nextSetup));
    set({
      chassisSetup: nextSetup,
    });
  },
  saveTireSetup: async (setup) => {
    const nextSetup = {
      ...emptyTireSetup,
      ...setup,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.tireSetup, JSON.stringify(nextSetup));
    set({
      tireSetup: nextSetup,
    });
  },
  saveSuspensionSetup: async (setup) => {
    const nextSetup = {
      ...emptySuspensionSetup,
      ...setup,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.suspensionSetup, JSON.stringify(nextSetup));
    set({
      suspensionSetup: nextSetup,
    });
  },
  addSavedTrack: async ({ name, trackType, banking, length, notes }) => {
    const trimmedName = name.trim();
    const trimmedTrackType = trackType.trim() || "Dirt Oval";
    const trimmedLength = length.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedName || !trimmedLength) {
      throw new Error("Enter a track name and track length.");
    }

    const normalizedName = normalizeTrackName(trimmedName);
    const existingTracks = get().savedTracks;
    const nextTrack: SavedTrack = {
      id:
        existingTracks.find((track) => normalizeTrackName(track.name) === normalizedName)?.id ??
        `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      name: trimmedName,
      trackType: trimmedTrackType,
      banking,
      length: trimmedLength,
      notes: trimmedNotes,
      createdAt:
        existingTracks.find((track) => normalizeTrackName(track.name) === normalizedName)?.createdAt ??
        new Date().toISOString(),
    };

    const nextSavedTracks = [
      nextTrack,
      ...existingTracks.filter((track) => normalizeTrackName(track.name) !== normalizedName),
    ].sort((a, b) => a.name.localeCompare(b.name));

    await AsyncStorage.setItem(STORAGE_KEYS.savedTracks, JSON.stringify(nextSavedTracks));
    set({
      savedTracks: nextSavedTracks,
    });
  },
  deleteSavedTrack: async (trackId) => {
    const nextSavedTracks = get().savedTracks.filter((track) => track.id !== trackId);
    await AsyncStorage.setItem(STORAGE_KEYS.savedTracks, JSON.stringify(nextSavedTracks));
    set({
      savedTracks: nextSavedTracks,
    });
  },
  addTireInventoryItem: async ({ label, position, circumference, pressure, notes }) => {
    const trimmedLabel = label.trim();
    const trimmedPosition = position.trim();
    const trimmedCircumference = circumference.trim();
    const trimmedPressure = pressure.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedLabel || !trimmedPosition || !trimmedCircumference || !trimmedPressure) {
      throw new Error("Enter a label, tire position, circumference, and pressure.");
    }

    const circumferenceValue = Number.parseFloat(trimmedCircumference);
    const pressureValue = Number.parseFloat(trimmedPressure);

    if (
      Number.isNaN(circumferenceValue) ||
      circumferenceValue <= 0 ||
      Number.isNaN(pressureValue) ||
      pressureValue < 0
    ) {
      throw new Error("Tire circumference and pressure must be valid numbers.");
    }

    const nextItem: TireInventoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      label: trimmedLabel,
      position: trimmedPosition,
      circumference: trimmedCircumference,
      pressure: trimmedPressure,
      notes: trimmedNotes,
      createdAt: new Date().toISOString(),
    };

    const nextTireInventory = [nextItem, ...get().tireInventory];
    await AsyncStorage.setItem(STORAGE_KEYS.tireInventory, JSON.stringify(nextTireInventory));
    set({
      tireInventory: nextTireInventory,
    });
  },
  deleteTireInventoryItem: async (tireId) => {
    const nextTireInventory = get().tireInventory.filter((item) => item.id !== tireId);
    await AsyncStorage.setItem(STORAGE_KEYS.tireInventory, JSON.stringify(nextTireInventory));
    set({
      tireInventory: nextTireInventory,
    });
  },
  addGearInventoryItem: async ({
    label,
    ringTeeth,
    pinionTeeth,
    quickChangeTopTeeth,
    quickChangeBottomTeeth,
    notes,
  }) => {
    const trimmedLabel = label.trim();
    const trimmedRingTeeth = ringTeeth.trim();
    const trimmedPinionTeeth = pinionTeeth.trim();
    const trimmedQuickChangeTopTeeth = quickChangeTopTeeth.trim();
    const trimmedQuickChangeBottomTeeth = quickChangeBottomTeeth.trim();
    const trimmedNotes = notes.trim();

    if (
      !trimmedLabel ||
      !trimmedRingTeeth ||
      !trimmedPinionTeeth ||
      !trimmedQuickChangeTopTeeth ||
      !trimmedQuickChangeBottomTeeth
    ) {
      throw new Error(
        "Enter a label, ring gear teeth, pinion gear teeth, and both quick-change gears.",
      );
    }

    const ringValue = Number.parseFloat(trimmedRingTeeth);
    const pinionValue = Number.parseFloat(trimmedPinionTeeth);
    const quickChangeTopValue = Number.parseFloat(trimmedQuickChangeTopTeeth);
    const quickChangeBottomValue = Number.parseFloat(trimmedQuickChangeBottomTeeth);

    if (
      Number.isNaN(ringValue) ||
      Number.isNaN(pinionValue) ||
      pinionValue <= 0 ||
      Number.isNaN(quickChangeTopValue) ||
      Number.isNaN(quickChangeBottomValue) ||
      quickChangeBottomValue <= 0
    ) {
      throw new Error("Gear teeth values must be valid numbers.");
    }

    const nextItem: GearInventoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      label: trimmedLabel,
      ringTeeth: trimmedRingTeeth,
      pinionTeeth: trimmedPinionTeeth,
      quickChangeTopTeeth: trimmedQuickChangeTopTeeth,
      quickChangeBottomTeeth: trimmedQuickChangeBottomTeeth,
      ratio: ((ringValue / pinionValue) * (quickChangeTopValue / quickChangeBottomValue)).toFixed(3),
      notes: trimmedNotes,
      createdAt: new Date().toISOString(),
    };

    const nextGearInventory = [nextItem, ...get().gearInventory];
    await AsyncStorage.setItem(STORAGE_KEYS.gearInventory, JSON.stringify(nextGearInventory));
    set({
      gearInventory: nextGearInventory,
    });
  },
  deleteGearInventoryItem: async (gearId) => {
    const nextGearInventory = get().gearInventory.filter((item) => item.id !== gearId);
    await AsyncStorage.setItem(STORAGE_KEYS.gearInventory, JSON.stringify(nextGearInventory));
    set({
      gearInventory: nextGearInventory,
    });
  },
  createRaceEvent: async ({ title, trackName, eventDate }) => {
    const nextEvent: RaceEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      title: title.trim(),
      trackName: trackName.trim(),
      eventDate: formatStoredDateValue(eventDate.trim()),
      createdAt: new Date().toISOString(),
    };

    const { teamId } = get();

    if (isSupabaseConfigured && teamId) {
      const user = await getAuthUser();

      if (!user?.id) {
        throw new Error("No authenticated user found.");
      }

      const { error } = await supabase.from("race_events").insert({
        team_id: teamId,
        title: nextEvent.title,
        track_name: nextEvent.trackName,
        event_date: nextEvent.eventDate,
        created_by_user_id: user.id,
      });

      if (error) {
        if (isMissingRaceEventsTableError(error.message)) {
          throw new Error(
            "The shared race_events table is not in Supabase yet. Run the latest SQL update, then try adding the event again.",
          );
        }

        throw error;
      }

      const nextRaceEvents = await loadRaceEventsForTeam(teamId);
      await AsyncStorage.setItem(STORAGE_KEYS.raceEvents, JSON.stringify(nextRaceEvents));
      set({
        raceEvents: nextRaceEvents,
      });
      return;
    }

    const nextRaceEvents = [nextEvent, ...get().raceEvents].sort((a, b) =>
      getDateSortValue(a.eventDate) - getDateSortValue(b.eventDate),
    );

    await AsyncStorage.setItem(STORAGE_KEYS.raceEvents, JSON.stringify(nextRaceEvents));
    set({
      raceEvents: nextRaceEvents,
    });
  },
  updateRaceEventTitle: async (eventId, title) => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      throw new Error("Enter a race title first.");
    }

    const currentEvent = get().raceEvents.find((event) => event.id === eventId);

    if (!currentEvent) {
      throw new Error("Race event not found.");
    }

    const nextRaceEvents = get().raceEvents.map((event) =>
      event.id === eventId
        ? {
            ...event,
            title: trimmedTitle,
          }
        : event,
    );
    const nextRaceNights = get().raceNights.map((raceNight) =>
      raceNight.eventId === eventId
        ? normalizeRaceNightRecord({
            ...raceNight,
            eventTitle: trimmedTitle,
          })
        : raceNight,
    );

    const teamId = get().teamId;

    if (isSupabaseConfigured && teamId) {
      const { data: updatedRaceEvent, error } = await supabase
        .from("race_events")
        .update({ title: trimmedTitle })
        .eq("id", eventId)
        .eq("team_id", teamId);
        
      const { data: selectedRaceEvent, error: selectError } = await supabase
        .from("race_events")
        .select("id, title")
        .eq("id", eventId)
        .eq("team_id", teamId)
        .maybeSingle<{ id: string; title: string }>();

      if (error) {
        if (isMissingRaceEventsTableError(error.message)) {
          throw new Error(
            "The shared race_events table is not in Supabase yet. Run the latest SQL update, then try editing the event again.",
          );
        }

        throw error;
      }

      if (selectError) {
        throw selectError;
      }

      if (!selectedRaceEvent || selectedRaceEvent.title !== trimmedTitle) {
        throw new Error(
          "The shared race title update was blocked. Re-run the latest Supabase schema update, then try saving the title again.",
        );
      }

      const relatedRaceNights = nextRaceNights.filter((raceNight) => raceNight.eventId === eventId);
      for (const raceNight of relatedRaceNights) {
        try {
          await upsertRaceNightForTeam(teamId, raceNight);
        } catch (raceNightError) {
          if (
            !(raceNightError instanceof Error) ||
            !isMissingRaceNightsTableError(raceNightError.message)
          ) {
            console.warn("Unable to sync renamed race night title.", raceNightError);
          }
        }
      }

      const syncedRaceEvents = await loadRaceEventsForTeam(teamId);
      await AsyncStorage.setItem(STORAGE_KEYS.raceEvents, JSON.stringify(syncedRaceEvents));
      set({
        raceEvents: syncedRaceEvents,
        raceNights: nextRaceNights,
      });
      await persistRaceNightsLocally(nextRaceNights);
      return;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.raceEvents, JSON.stringify(nextRaceEvents));
    await persistRaceNightsLocally(nextRaceNights);
    set({
      raceEvents: nextRaceEvents,
      raceNights: nextRaceNights,
    });
  },
  deleteRaceEvent: async (eventId) => {
    const nextRaceEvents = get().raceEvents.filter((event) => event.id !== eventId);
    await AsyncStorage.setItem(STORAGE_KEYS.raceEvents, JSON.stringify(nextRaceEvents));
    set({ raceEvents: nextRaceEvents });

    const teamId = get().teamId;

    if (isSupabaseConfigured && teamId) {
      const { error } = await supabase
        .from("race_events")
        .delete()
        .eq("id", eventId)
        .eq("team_id", teamId);

      if (error) {
        if (isMissingRaceEventsTableError(error.message)) {
          throw new Error(
            "The shared race_events table is not in Supabase yet. Run the latest SQL update, then try deleting the event again.",
          );
        }

        throw error;
      }

      const syncedRaceEvents = await loadRaceEventsForTeam(teamId);
      await AsyncStorage.setItem(STORAGE_KEYS.raceEvents, JSON.stringify(syncedRaceEvents));
      set({ raceEvents: syncedRaceEvents });
    }
  },
  getActiveRaceNightIdForEvent: (eventId) =>
    get().raceNights.find((raceNight) => raceNight.eventId === eventId && raceNight.status === "active")
      ?.id,
  startRaceNight: async (eventId, options) => {
    const event = get().raceEvents.find((entry) => entry.id === eventId);
    const chassisSetup = get().chassisSetup;
    const tireSetup = get().tireSetup;
    const suspensionSetup = get().suspensionSetup;
    const savedTrack = findSavedTrackMatch(get().savedTracks, event?.trackName ?? "");
    const builtInTrack = findDirtOvalTrackByName(event?.trackName ?? "");
    const resolvedTrackType = savedTrack?.trackType ?? builtInTrack?.trackType ?? "Dirt Oval";
    const resolvedTrackBanking = savedTrack?.banking ?? builtInTrack?.banking ?? "";
    const resolvedTrackLength = savedTrack?.length ?? builtInTrack?.length ?? "";

    if (!event) {
      throw new Error("Race event not found.");
    }

    const activeRaceNight = get().raceNights.find(
      (raceNight) => raceNight.eventId === event.id && raceNight.status === "active",
    );

    if (activeRaceNight) {
      return activeRaceNight.id;
    }

    const otherActiveRaceNight = get().raceNights.find(
      (raceNight) => raceNight.eventId !== event.id && raceNight.status === "active",
    );

    if (otherActiveRaceNight) {
      if (options?.completeOtherActive) {
        const completedOtherRaceNight = normalizeRaceNightRecord({
          ...otherActiveRaceNight,
          status: "completed",
        });
        const nextRaceNights = get().raceNights.map((raceNight) =>
          raceNight.id === otherActiveRaceNight.id ? completedOtherRaceNight : raceNight,
        );

        await persistRaceNightsLocally(nextRaceNights);
        set({ raceNights: nextRaceNights });

        const teamId = get().teamId;
        if (isSupabaseConfigured && teamId) {
          try {
            await upsertRaceNightForTeam(teamId, completedOtherRaceNight);
          } catch (error) {
            if (
              !(error instanceof Error) ||
              (!isMissingRaceNightsTableError(error.message) &&
                !isSupabaseAuthSessionError(error.message))
            ) {
              console.warn("Unable to sync completed previous race night. Keeping local change only.", error);
            }
          }
        }
      } else if (!options?.allowWithOtherActive) {
        throw new Error(
          `Complete the currently open race night for ${otherActiveRaceNight.eventTitle} before starting a new one.`,
        );
      }
    }

    const nextRaceNight = normalizeRaceNightRecord({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      eventId: event.id,
      eventTitle: event.title,
      trackName: event.trackName,
      eventDate: event.eventDate,
      lastViewedStage: "hotLaps",
      racingType: get().racingType,
      raceCarType: get().raceCarType,
      carClass: get().carClass,
      status: "active",
      createdAt: new Date().toISOString(),
      weatherTemperature: "",
      humidity: "",
      windCondition: "",
      skyCondition: "",
      precipitation: "",
      weatherNotes: "",
      trackTemperature: "",
      trackType: savedTrack?.trackType ?? "Dirt Oval",
      trackBanking: savedTrack?.banking ?? "",
      trackLength: savedTrack?.length ?? "",
      trackSurface: "",
      moistureState: "",
      trackNotes: "",
      heatStartPosition: "",
      heatFinishPosition: "",
      featureStartPosition: "",
      featureFinishPosition: "",
      setupChanges: "",
      driverNotes: "",
      crewNotes: "",
      lapTimes: "",
      checklistSections: createDefaultChecklistSections(),
      stageSessions: {
        hotLaps: normalizeRaceNightStageData({
          ...buildHotLapsBaselineStage(chassisSetup, tireSetup, suspensionSetup),
          trackType: resolvedTrackType,
          trackBanking: resolvedTrackBanking,
          trackLength: resolvedTrackLength,
        }),
        heat: normalizeRaceNightStageData({
          ...createEmptyRaceNightStageData(),
          trackType: resolvedTrackType,
          trackBanking: resolvedTrackBanking,
          trackLength: resolvedTrackLength,
        }),
        bFeature: normalizeRaceNightStageData({
          ...createEmptyRaceNightStageData(),
          trackType: resolvedTrackType,
          trackBanking: resolvedTrackBanking,
          trackLength: resolvedTrackLength,
        }),
        aFeature: normalizeRaceNightStageData({
          ...createEmptyRaceNightStageData(),
          trackType: resolvedTrackType,
          trackBanking: resolvedTrackBanking,
          trackLength: resolvedTrackLength,
        }),
      },
    } satisfies RaceNight);

    const teamId = get().teamId;
    const nextRaceNights = [nextRaceNight, ...get().raceNights].map(normalizeRaceNightRecord);
    await persistRaceNightsLocally(nextRaceNights);
    set({ raceNights: nextRaceNights });

    if (isSupabaseConfigured && teamId) {
      try {
        await upsertRaceNightForTeam(teamId, nextRaceNight);
        startRaceNightSyncLoop(teamId);
      } catch (error) {
        if (
          !(error instanceof Error) ||
          (!isMissingRaceNightsTableError(error.message) &&
            !isSupabaseAuthSessionError(error.message))
        ) {
          console.warn("Unable to sync new race night. Keeping local race night only.", error);
        }
      }
    }

    return nextRaceNight.id;
  },
  saveRaceNight: async (raceNightId, updates) => {
    const currentRaceNight = get().raceNights.find((raceNight) => raceNight.id === raceNightId);
    if (!currentRaceNight) {
      throw new Error("Race night not found.");
    }

    let nextRaceNight = normalizeRaceNightRecord({
      ...currentRaceNight,
      ...updates,
      stageSessions: updates.stageSessions ?? currentRaceNight.stageSessions,
    });
    const teamId = get().teamId;

    if (isSupabaseConfigured && teamId) {
      try {
        const remoteRaceNight = await loadRaceNightForTeam(teamId, raceNightId);

        if (remoteRaceNight) {
          nextRaceNight = mergeRaceNightChecklistForSave(nextRaceNight, remoteRaceNight);
        }
      } catch (error) {
        if (
          !(error instanceof Error) ||
          (!isMissingRaceNightsTableError(error.message) &&
            !isSupabaseAuthSessionError(error.message))
        ) {
          console.warn("Unable to merge shared checklist before saving race night.", error);
        }
      }
    }

    const nextStatus = nextRaceNight.status;
    const relatedEventId = nextRaceNight.eventId;

    const nextRaceNights = get().raceNights.map((raceNight) => {
      if (raceNight.id === raceNightId) {
        return nextRaceNight;
      }

      if (
        nextStatus === "completed" &&
        relatedEventId &&
        raceNight.eventId === relatedEventId &&
        raceNight.status === "active"
      ) {
        return { ...raceNight, status: "completed" as const };
      }

      return raceNight;
    });

    await persistRaceNightsLocally(nextRaceNights);
    set({ raceNights: nextRaceNights });

    if (isSupabaseConfigured && teamId) {
      try {
        await upsertRaceNightForTeam(teamId, nextRaceNight);
      } catch (error) {
        if (error instanceof Error && isMissingRaceNightsTableError(error.message)) {
          console.warn("Race night sync table is unavailable. Keeping local changes only.", error);
          return;
        }

        console.warn("Unable to sync race night changes. Keeping local changes only.", error);
        throw error;
      }
    }
  },
  refreshRaceNight: async (raceNightId) => {
    const teamId = get().teamId;

    if (!isSupabaseConfigured || !teamId) {
      return;
    }

    const remoteRaceNight = await loadRaceNightForTeam(teamId, raceNightId);

    if (!remoteRaceNight) {
      return;
    }

    const currentRaceNights = get().raceNights;
    const localRaceNight = currentRaceNights.find((raceNight) => raceNight.id === raceNightId);
    const nextRaceNight = localRaceNight
      ? mergeRaceNightChecklistForSync(localRaceNight, remoteRaceNight)
      : remoteRaceNight;
    const nextRaceNights = localRaceNight
      ? currentRaceNights.map((raceNight) => (raceNight.id === raceNightId ? nextRaceNight : raceNight))
      : [nextRaceNight, ...currentRaceNights];

    await persistRaceNightsLocally(nextRaceNights);
    set({ raceNights: nextRaceNights });
  },
  deleteRaceNight: async (raceNightId) => {
    const nextRaceNights = get().raceNights.filter((raceNight) => raceNight.id !== raceNightId);

    await persistRaceNightsLocally(nextRaceNights);
    set({ raceNights: nextRaceNights });

    const teamId = get().teamId;

    if (isSupabaseConfigured && teamId) {
      const { error } = await supabase.from("race_nights").delete().eq("id", raceNightId).eq("team_id", teamId);

      if (error && !isMissingRaceNightsTableError(error.message)) {
        console.warn("Unable to delete shared race night. Keeping local deletion only.", error);
      }
    }
  },
    clearInviteLink: () => {
      set({
        inviteLinkEmail: undefined,
        inviteLinkToken: undefined,
        inviteLinkTeamName: undefined,
      });
    },
    signOut: async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }

      stopRaceNightSyncLoop();
      await clearAuthSnapshot();
      await AsyncStorage.setItem(STORAGE_KEYS.raceEvents, JSON.stringify(emptyRaceEvents));
      await persistRaceNightsLocally(emptyRaceNights);

      set({
        isPasswordRecovery: false,
        inviteLinkEmail: undefined,
        inviteLinkToken: undefined,
        inviteLinkTeamName: undefined,
        shouldOpenSettingsAfterTeamCreate: false,
        userId: undefined,
        teamId: undefined,
      currentTeamRole: undefined,
      teamName: undefined,
      userName: undefined,
      userEmail: undefined,
      driverName: undefined,
      crewChiefName: undefined,
      racingType: undefined,
      raceCarType: undefined,
      carClass: undefined,
      engineType: undefined,
      fuelType: undefined,
      carburetorType: undefined,
      isTeamOwner: false,
      teamMembers: [],
      pendingInvites: [],
      raceEvents: [],
      raceNights: [],
      isReplayingHomeTutorial: false,
    });
  },
}));
