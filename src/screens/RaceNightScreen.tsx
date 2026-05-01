import React, { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Keyboard, Modal, Pressable, StyleSheet, Text, TextInput as RNTextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import TextInput from "../components/AppTextInput";
import AppPressable from "../components/AppPressable";
import KeyboardScreen from "../components/KeyboardScreen";
import {
  ChassisSetup,
  GearSetup,
  RaceNight,
  RaceNightStageData,
  RaceNightStageKey,
  SuspensionSetup,
  TireSetup,
  raceNightStageLabels,
  raceNightStageOrder,
  useAppStore,
} from "../store/useAppStore";
import { colors, spacing } from "../theme";
import { formatStoredDateValue, getDateSortValue } from "../utils/date";
import { calculateGearRatio, formatGearRatio } from "../utils/gears";
import { calculateEstimatedScaleEffect } from "../utils/estimatedScaleEffect";
import {
  normalizeFractionMeasurementInput,
  sanitizeFractionMeasurementInput,
} from "../utils/measurementInputs";
import { calculateScalePercentages } from "../utils/scales";
import { calculateStaggerValue, formatMeasurementValue } from "../utils/tireMeasurements";

function cloneStageData(stage: RaceNightStageData): RaceNightStageData {
  return {
    ...stage,
    started: true,
    lapTimer: {
      entries: stage.lapTimer.entries.map((entry) => ({
        ...entry,
      })),
    },
    setupAdjustments: {
      ...stage.setupAdjustments,
      chassis: {
        ...stage.setupAdjustments.chassis,
      },
      tires: {
        ...stage.setupAdjustments.tires,
      },
      suspension: {
        ...stage.setupAdjustments.suspension,
      },
    },
    checklistSections: stage.checklistSections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
      })),
    })),
  };
}

function getInitialStage(raceNight?: RaceNight): RaceNightStageKey {
  if (!raceNight) {
    return "hotLaps";
  }

  if (raceNight.lastViewedStage && raceNightStageOrder.includes(raceNight.lastViewedStage)) {
    return raceNight.lastViewedStage;
  }

  return [...raceNightStageOrder]
    .reverse()
    .find((stageKey) => raceNight.stageSessions[stageKey].started) ?? "hotLaps";
}

type ChassisFieldKey = keyof ChassisSetup;
type TireFieldKey = keyof TireSetup;
type SuspensionFieldKey = keyof SuspensionSetup;

const raceNightChassisFields: Array<{
  key: ChassisFieldKey;
  label: string;
  placeholder: string;
  keyboardType?: "numbers-and-punctuation";
}> = [
  { key: "rideHeightLf", label: "LF Ride Height", placeholder: "5 3/4", keyboardType: "numbers-and-punctuation" },
  { key: "rideHeightRf", label: "RF Ride Height", placeholder: "5 1/2", keyboardType: "numbers-and-punctuation" },
  { key: "rideHeightLr", label: "LR Ride Height", placeholder: "6 1/4", keyboardType: "numbers-and-punctuation" },
  { key: "rideHeightRr", label: "RR Ride Height", placeholder: "6", keyboardType: "numbers-and-punctuation" },
];

const raceNightWheelOffsetFields: Array<{
  key: TireFieldKey;
  label: string;
  placeholder: string;
  keyboardType?: "numbers-and-punctuation";
}> = [
  { key: "lfWheelOffset", label: "LF Wheel Offset", placeholder: "2", keyboardType: "numbers-and-punctuation" },
  { key: "rfWheelOffset", label: "RF Wheel Offset", placeholder: "3", keyboardType: "numbers-and-punctuation" },
  { key: "lrWheelOffset", label: "LR Wheel Offset", placeholder: "4", keyboardType: "numbers-and-punctuation" },
  { key: "rrWheelOffset", label: "RR Wheel Offset", placeholder: "4", keyboardType: "numbers-and-punctuation" },
];

const raceNightWingSprintFields: Array<{
  key: ChassisFieldKey;
  label: string;
  placeholder: string;
}> = [
  { key: "topWingAngle", label: "Top Wing Angle", placeholder: "12" },
  { key: "sliderPosition", label: "Slider Position", placeholder: "4 in back" },
  { key: "wickerBillSize", label: "Wicker Bill Size", placeholder: "2 in" },
  { key: "noseWingAngle", label: "Nose Wing Angle", placeholder: "6" },
];

const raceNightScaleWeightFields: Array<{ key: ChassisFieldKey; label: string; placeholder: string }> = [
  { key: "scaleLf", label: "LF Scale Weight", placeholder: "625" },
  { key: "scaleRf", label: "RF Scale Weight", placeholder: "575" },
  { key: "scaleLr", label: "LR Scale Weight", placeholder: "650" },
  { key: "scaleRr", label: "RR Scale Weight", placeholder: "600" },
];

const raceNightCalculatedPercentFields: Array<{ key: ChassisFieldKey; label: string; placeholder: string }> = [
  { key: "crossweightWedge", label: "Crossweight / Wedge %", placeholder: "52.5" },
  { key: "leftSidePercentage", label: "Left Side %", placeholder: "54.0" },
  { key: "rearPercentage", label: "Rear %", placeholder: "58.0" },
];

const raceNightJackBoltFields: Array<{ key: ChassisFieldKey; label: string; placeholder: string }> = [
  { key: "lfJackBoltTurns", label: "LF Jack Bolt Turns", placeholder: "0.0" },
  { key: "rfJackBoltTurns", label: "RF Jack Bolt Turns", placeholder: "0.0" },
  { key: "lrJackBoltTurns", label: "LR Jack Bolt Turns", placeholder: "0.0" },
  { key: "rrJackBoltTurns", label: "RR Jack Bolt Turns", placeholder: "0.0" },
];

const raceNightSpringChangeFields: Array<{ key: ChassisFieldKey; label: string; placeholder: string }> = [
  { key: "lfSpringChange", label: "LF Spring Change", placeholder: "0" },
  { key: "rfSpringChange", label: "RF Spring Change", placeholder: "0" },
  { key: "lrSpringChange", label: "LR Spring Change", placeholder: "0" },
  { key: "rrSpringChange", label: "RR Spring Change", placeholder: "0" },
];

const raceNightShockChangeFields: Array<{ key: ChassisFieldKey; label: string; placeholder: string }> = [
  { key: "lfShockChange", label: "LF Shock Change", placeholder: "0" },
  { key: "rfShockChange", label: "RF Shock Change", placeholder: "0" },
  { key: "lrShockChange", label: "LR Shock Change", placeholder: "0" },
  { key: "rrShockChange", label: "RR Shock Change", placeholder: "0" },
];

const raceNightChassisNoteFields: Array<{ key: ChassisFieldKey; label: string; placeholder: string }> = [
  { key: "ballastLocation", label: "Ballast Location", placeholder: "40 lb behind seat" },
  { key: "wheelbaseNotes", label: "Wheelbase Notes", placeholder: "LF-RR 108.0 / RF-LR 107.5" },
  { key: "frameAttitude", label: "Frame Attitude", placeholder: "Nose down 0.5 in" },
];

const raceNightTireFields: Array<{
  key: TireFieldKey;
  label: string;
  placeholder: string;
  keyboardType?: "decimal-pad";
}> = [
  { key: "lfCircumference", label: "LF Circumference", placeholder: "92", keyboardType: "decimal-pad" },
  { key: "rfCircumference", label: "RF Circumference", placeholder: "93 1/4", keyboardType: "decimal-pad" },
  { key: "lrCircumference", label: "LR Circumference", placeholder: "94", keyboardType: "decimal-pad" },
  { key: "rrCircumference", label: "RR Circumference", placeholder: "95", keyboardType: "decimal-pad" },
  { key: "lfPressure", label: "LF Pressure", placeholder: "12", keyboardType: "decimal-pad" },
  { key: "rfPressure", label: "RF Pressure", placeholder: "14", keyboardType: "decimal-pad" },
  { key: "lrPressure", label: "LR Pressure", placeholder: "10", keyboardType: "decimal-pad" },
  { key: "rrPressure", label: "RR Pressure", placeholder: "11", keyboardType: "decimal-pad" },
];

const raceNightTireTempCorners = [
  {
    id: "lf",
    label: "LF",
    innerKey: "lfTempInner",
    middleKey: "lfTempMiddle",
    outerKey: "lfTempOuter",
  },
  {
    id: "rf",
    label: "RF",
    innerKey: "rfTempInner",
    middleKey: "rfTempMiddle",
    outerKey: "rfTempOuter",
  },
  {
    id: "lr",
    label: "LR",
    innerKey: "lrTempInner",
    middleKey: "lrTempMiddle",
    outerKey: "lrTempOuter",
  },
  {
    id: "rr",
    label: "RR",
    innerKey: "rrTempInner",
    middleKey: "rrTempMiddle",
    outerKey: "rrTempOuter",
  },
] as const;

const circumferenceWholeNumberOptions = Array.from({ length: 13 }, (_, index) => `${84 + index}`);
const circumferenceFractionOptions = ["0", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8"] as const;
type RaceNightTireCircumferenceFieldKey =
  | "lfCircumference"
  | "rfCircumference"
  | "lrCircumference"
  | "rrCircumference";

const raceNightSectionTabs = [
  { id: "weather", label: "Weather" },
  { id: "track", label: "Track" },
  { id: "checklist", label: "Checklist" },
  { id: "setups", label: "Setups" },
  { id: "lapTimes", label: "Lap Times" },
  { id: "results", label: "Positions" },
] as const;

const raceNightSetupTabs = [
  { id: "chassis", label: "Chassis" },
  { id: "tires", label: "Tires" },
  { id: "frontSuspension", label: "Front Suspension" },
  { id: "rearSuspension", label: "Rear Suspension" },
  { id: "gears", label: "Gears" },
] as const;

function getTotalLapsTooltipLabel(stageKey: RaceNightStageKey) {
  if (stageKey === "bFeature") {
    return "If B-Feature, Enter Total Laps";
  }

  return "Enter Total Laps";
}

function getStopwatchStageLabel(stageKey: RaceNightStageKey) {
  if (stageKey === "heat") {
    return "Heat Race";
  }

  return raceNightStageLabels[stageKey];
}

function getFirstName(value?: string) {
  return value?.trim().split(/\s+/)[0] || undefined;
}

function formatAverageTireTemp(values: string[]) {
  const numericValues = values
    .map((value) => Number.parseFloat(value))
    .filter((value) => Number.isFinite(value));

  if (!numericValues.length) {
    return "-";
  }

  const average = numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
  return Number.isInteger(average) ? `${average}` : average.toFixed(1);
}

function mergeChecklistSectionsForDisplay(
  currentSections: RaceNightStageData["checklistSections"],
  sharedSections: RaceNightStageData["checklistSections"],
) {
  const currentSectionMap = new Map(currentSections.map((section) => [section.id, section]));

  return sharedSections.map((sharedSection) => {
    const currentSection = currentSectionMap.get(sharedSection.id);
    const currentItemMap = new Map((currentSection?.items ?? []).map((item) => [item.id, item]));

    return {
      ...sharedSection,
      items: sharedSection.items.map((sharedItem) => {
        const currentItem = currentItemMap.get(sharedItem.id);
        const checked = currentItem ? currentItem.checked : sharedItem.checked;
        const checkedByName = checked
          ? currentItem
            ? currentItem.checkedByName
            : sharedItem.checkedByName
          : undefined;

        return {
          ...sharedItem,
          checked,
          checkedByName,
        };
      }),
    };
  });
}

function mergeRaceNightChecklistForDisplay(currentRaceNight: RaceNight, sharedRaceNight: RaceNight) {
  const nextStageSessions = { ...currentRaceNight.stageSessions };

  raceNightStageOrder.forEach((stageKey) => {
    nextStageSessions[stageKey] = {
      ...nextStageSessions[stageKey],
      checklistSections: mergeChecklistSectionsForDisplay(
        currentRaceNight.stageSessions[stageKey].checklistSections,
        sharedRaceNight.stageSessions[stageKey].checklistSections,
      ),
    };
  });

  return {
    ...currentRaceNight,
    stageSessions: nextStageSessions,
  };
}

const raceNightFrontSuspensionFields: Array<{ key: SuspensionFieldKey; label: string; placeholder: string; multiline?: boolean }> = [
  { key: "frontSprings", label: "Front Springs", placeholder: "LF 550 / RF 600" },
  { key: "frontShocks", label: "Front Shocks", placeholder: "LF 4-3 / RF 5-2" },
  { key: "camber", label: "Camber", placeholder: "LF +2.0 / RF -4.0" },
  { key: "caster", label: "Caster", placeholder: "LF +2.5 / RF +6.0" },
  { key: "toe", label: "Toe", placeholder: "1/8 out" },
  { key: "travelBumpStops", label: "Travel / Bump Stops", placeholder: "RF 2.0 in travel", multiline: true },
];

const raceNightRearSuspensionFields: Array<{ key: SuspensionFieldKey; label: string; placeholder: string; multiline?: boolean }> = [
  { key: "rearSprings", label: "Rear Springs", placeholder: "LR 225 / RR 200" },
  { key: "rearShocks", label: "Rear Shocks", placeholder: "LR 6-2 / RR 4-4" },
  { key: "trailingArmAngles", label: "Trailing Arm Angles", placeholder: "LR 2 down, RR level" },
  { key: "pullBarLiftArm", label: "Pull Bar / Lift Arm", placeholder: "Pull bar 18 in, 3rd hole" },
  { key: "jBarPanhardHeight", label: "J-Bar / Panhard Height", placeholder: "Frame 9 in / Rearend 8 in" },
  { key: "birdcageIndexingNotes", label: "Birdcage / Indexing Notes", placeholder: "LR indexed 5 degrees", multiline: true },
];

const raceNightGearFields: Array<{ key: keyof GearSetup; label: string; placeholder: string; halfWidth?: boolean }> = [
  { key: "ringTeeth", label: "Ring Teeth", placeholder: "34", halfWidth: true },
  { key: "pinionTeeth", label: "Pinion Teeth", placeholder: "7", halfWidth: true },
  { key: "quickChangeTopTeeth", label: "Top Quick-Change Gear", placeholder: "25", halfWidth: true },
  { key: "quickChangeBottomTeeth", label: "Bottom Quick-Change Gear", placeholder: "21", halfWidth: true },
  { key: "notes", label: "Gear Notes", placeholder: "Installed 5.14 quick-change for tacky surface...", halfWidth: false },
];

export default function RaceNightScreen({ navigation, route }: any) {
  const keyboardScrollRef = React.useRef<KeyboardAwareScrollView>(null);
  const totalLapsInputRef = React.useRef<RNTextInput>(null);
  const pinnedTabsVisibleRef = React.useRef(false);
  const isUserScrollingRef = React.useRef(false);
  const lastUserScrollAtRef = React.useRef(0);
  const recentLocalEditUntilRef = React.useRef(0);
  const insets = useSafeAreaInsets();
  const raceNightId = route.params?.raceNightId as string;
  const isTeamOwner = useAppStore((state) => state.isTeamOwner);
  const userId = useAppStore((state) => state.userId);
  const userName = useAppStore((state) => state.userName);
  const userEmail = useAppStore((state) => state.userEmail);
  const teamMembers = useAppStore((state) => state.teamMembers);
  const raceNights = useAppStore((state) => state.raceNights);
  const saveRaceNight = useAppStore((state) => state.saveRaceNight);
  const refreshRaceNight = useAppStore((state) => state.refreshRaceNight);
  const updateRaceEventTitle = useAppStore((state) => state.updateRaceEventTitle);
  const raceNight = useMemo(
    () => raceNights.find((entry) => entry.id === raceNightId),
    [raceNightId, raceNights],
  );
  const [draftRaceNight, setDraftRaceNight] = useState<RaceNight | undefined>(raceNight);
  const [activeStage, setActiveStage] = useState<RaceNightStageKey>(getInitialStage(raceNight));
  const [activeSection, setActiveSection] =
    useState<(typeof raceNightSectionTabs)[number]["id"]>("weather");
  const [activeSetupTab, setActiveSetupTab] =
    useState<(typeof raceNightSetupTabs)[number]["id"]>("chassis");
  const [liveTimers, setLiveTimers] = useState<
    Record<
      RaceNightStageKey,
      { isRunning: boolean; elapsedMs: number; lapStartedAt?: number; isCaution: boolean }
    >
  >({
    hotLaps: { isRunning: false, elapsedMs: 0, isCaution: false },
    heat: { isRunning: false, elapsedMs: 0, isCaution: false },
    bFeature: { isRunning: false, elapsedMs: 0, isCaution: false },
    aFeature: { isRunning: false, elapsedMs: 0, isCaution: false },
  });
  const [, setTimerTick] = useState(0);
  const [weatherAutofillStage, setWeatherAutofillStage] = useState<RaceNightStageKey | null>(null);
  const [weatherAutofillMessage, setWeatherAutofillMessage] = useState("");
  const [activeCircumferenceField, setActiveCircumferenceField] =
    useState<RaceNightTireCircumferenceFieldKey | null>(null);
  const [selectedWholeNumber, setSelectedWholeNumber] = useState("");
  const [selectedFraction, setSelectedFraction] =
    useState<(typeof circumferenceFractionOptions)[number]>("0");
  const [sectionContentAnchorY, setSectionContentAnchorY] = useState(0);
  const [setupsSectionAnchorY, setSetupsSectionAnchorY] = useState(0);
  const [totalLapsAnchorY, setTotalLapsAnchorY] = useState(0);
  const [pinnedTabsVisible, setPinnedTabsVisible] = useState(false);
  const [titleHeaderHeight, setTitleHeaderHeight] = useState(0);
  const [pinnedHeaderHeight, setPinnedHeaderHeight] = useState(0);
  const [pinnedStageTabsHeight, setPinnedStageTabsHeight] = useState(0);
  const [inlineTabsHeaderHeight, setInlineTabsHeaderHeight] = useState(0);
  const [inlineStageTabsHeight, setInlineStageTabsHeight] = useState(0);
  const [pendingStageScrollKey, setPendingStageScrollKey] = useState<string>();
  const [pendingSectionScrollTarget, setPendingSectionScrollTarget] =
    useState<(typeof raceNightSectionTabs)[number]["id"] | null>(null);
  const [totalLapsTooltipStage, setTotalLapsTooltipStage] = useState<RaceNightStageKey | null>(null);
  const [focusedRaceNightInputCount, setFocusedRaceNightInputCount] = useState(0);
  const [isTitleEditorVisible, setIsTitleEditorVisible] = useState(false);
  const [editedRaceTitle, setEditedRaceTitle] = useState("");
  const [isSavingRaceTitle, setIsSavingRaceTitle] = useState(false);

  const showRaceNightInstructions = () => {
    Alert.alert(
      "Race Night Tips",
      "Tap each race-stage tab as the night moves forward. The next stage starts with the prior stage's saved inputs, and you only edit what changed.",
    );
  };

  const openTitleEditor = () => {
    setEditedRaceTitle(draftRaceNight?.eventTitle ?? "");
    setIsTitleEditorVisible(true);
  };

  const handleSaveRaceTitle = async () => {
    const trimmedTitle = editedRaceTitle.trim();

    if (!draftRaceNight) {
      return;
    }

    if (!trimmedTitle) {
      Alert.alert("Title Required", "Enter a race title first.");
      return;
    }

    try {
      setIsSavingRaceTitle(true);
      await updateRaceEventTitle(draftRaceNight.eventId, trimmedTitle);
      setDraftRaceNight((current) =>
        current
          ? {
              ...current,
              eventTitle: trimmedTitle,
            }
          : current,
      );
      setIsTitleEditorVisible(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update the race title.";
      Alert.alert("Save failed", message);
    } finally {
      setIsSavingRaceTitle(false);
    }
  };

  useEffect(() => {
    setDraftRaceNight(raceNight);
    setActiveStage(getInitialStage(raceNight));
    setActiveSection("weather");
    setActiveSetupTab("chassis");
    setLiveTimers({
      hotLaps: { isRunning: false, elapsedMs: 0, isCaution: false },
      heat: { isRunning: false, elapsedMs: 0, isCaution: false },
      bFeature: { isRunning: false, elapsedMs: 0, isCaution: false },
      aFeature: { isRunning: false, elapsedMs: 0, isCaution: false },
    });
    setTotalLapsTooltipStage(null);
    setActiveCircumferenceField(null);
    setSelectedWholeNumber("");
    setSelectedFraction("0");
    setPendingSectionScrollTarget(null);
  }, [raceNightId, raceNight?.id]);

  useEffect(() => {
    if (!activeCircumferenceField || !draftRaceNight) {
      return;
    }

    const currentValue = draftRaceNight.stageSessions[activeStage].setupAdjustments.tires[
      activeCircumferenceField
    ];
    const match = currentValue.trim().match(/^(\d+)(?:\s+((?:1|3|5|7)\/8|1\/4|1\/2|3\/4))?$/);

    if (!match) {
      setSelectedWholeNumber("");
      setSelectedFraction("0");
      return;
    }

    setSelectedWholeNumber(match[1]);
    setSelectedFraction((match[2] as (typeof circumferenceFractionOptions)[number] | undefined) ?? "0");
  }, [activeCircumferenceField, activeStage, draftRaceNight]);

  useEffect(() => {
    const anyRunning = Object.values(liveTimers).some((timer) => timer.isRunning);
    if (!anyRunning) {
      return;
    }

    const interval = setInterval(() => {
      setTimerTick((current) => current + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [liveTimers]);

  if (!draftRaceNight) {
    return (
      <View style={styles.centered}>
        <Text style={styles.h1}>Race night not found</Text>
        <Text style={styles.subhead}>The selected race night could not be loaded.</Text>
      </View>
    );
  }

  const currentStage = draftRaceNight.stageSessions[activeStage];
  const isWingSprintCar =
    draftRaceNight.raceCarType === "Sprint Car" &&
    (draftRaceNight.carClass?.trim().startsWith("Wing Sprint") ?? false);
  const hotLapsWeatherZipCode = draftRaceNight.stageSessions.hotLaps.weatherZipCode;
  const isHotLapsStage = activeStage === "hotLaps";
  const weatherActionLabel = isHotLapsStage ? "Auto Fill Weather" : "Refresh Weather";
  const isInheritedWeatherZipLocked = !isHotLapsStage && Boolean(hotLapsWeatherZipCode.trim());
  const isReadOnly = draftRaceNight.status === "completed";
  const isWeatherZipEditable = !isReadOnly && (isHotLapsStage || !isInheritedWeatherZipLocked);
  const isRaceDay = formatStoredDateValue(draftRaceNight.eventDate) === formatStoredDateValue(new Date().toISOString());
  const isPastRace = getDateSortValue(draftRaceNight.eventDate) < getDateSortValue(formatStoredDateValue(new Date().toISOString()));
  const isStageLockedForPreRace = !isReadOnly && !isHotLapsStage && !isRaceDay && !isPastRace;
  const isStageInputDisabled = isReadOnly || isStageLockedForPreRace;
  const activeLiveTimer = liveTimers[activeStage];
  const elapsedCurrentLapMs = activeLiveTimer.isRunning
    ? activeLiveTimer.elapsedMs + (Date.now() - (activeLiveTimer.lapStartedAt ?? Date.now()))
    : activeLiveTimer.elapsedMs;
  const completedRaceLaps = currentStage.lapTimer.entries.filter((entry) => !entry.caution).length;
  const totalRaceTimeMs =
    currentStage.lapTimer.entries.reduce((total, entry) => total + entry.durationMs, 0) +
    elapsedCurrentLapMs;
  const displayedLapNumber =
    activeLiveTimer.isCaution
      ? completedRaceLaps
      : activeLiveTimer.isRunning || activeLiveTimer.elapsedMs > 0
        ? completedRaceLaps + 1
        : completedRaceLaps;
  const fastestLap = currentStage.lapTimer.entries
    .filter((entry) => !entry.caution)
    .sort((a, b) => a.durationMs - b.durationMs)[0];
  const frontStaggerValue = useMemo(
    () =>
      calculateStaggerValue(
        currentStage.setupAdjustments.tires.lfCircumference,
        currentStage.setupAdjustments.tires.rfCircumference,
      ),
    [
      currentStage.setupAdjustments.tires.lfCircumference,
      currentStage.setupAdjustments.tires.rfCircumference,
    ],
  );
  const rearStaggerValue = useMemo(
    () =>
      calculateStaggerValue(
        currentStage.setupAdjustments.tires.lrCircumference,
        currentStage.setupAdjustments.tires.rrCircumference,
      ),
    [
      currentStage.setupAdjustments.tires.lrCircumference,
      currentStage.setupAdjustments.tires.rrCircumference,
    ],
  );
  const frontStagger =
    frontStaggerValue == null ? "-" : formatMeasurementValue(frontStaggerValue, "fraction");
  const rearStagger =
    rearStaggerValue == null ? "-" : formatMeasurementValue(rearStaggerValue, "fraction");
  const tireTempAverages = useMemo(
    () => ({
      lf: formatAverageTireTemp([
        currentStage.setupAdjustments.tires.lfTempInner,
        currentStage.setupAdjustments.tires.lfTempMiddle,
        currentStage.setupAdjustments.tires.lfTempOuter,
      ]),
      rf: formatAverageTireTemp([
        currentStage.setupAdjustments.tires.rfTempInner,
        currentStage.setupAdjustments.tires.rfTempMiddle,
        currentStage.setupAdjustments.tires.rfTempOuter,
      ]),
      lr: formatAverageTireTemp([
        currentStage.setupAdjustments.tires.lrTempInner,
        currentStage.setupAdjustments.tires.lrTempMiddle,
        currentStage.setupAdjustments.tires.lrTempOuter,
      ]),
      rr: formatAverageTireTemp([
        currentStage.setupAdjustments.tires.rrTempInner,
        currentStage.setupAdjustments.tires.rrTempMiddle,
        currentStage.setupAdjustments.tires.rrTempOuter,
      ]),
    }),
    [currentStage.setupAdjustments.tires],
  );
  const gearRatioValue = useMemo(
    () =>
      calculateGearRatio(
        currentStage.setupAdjustments.gears.ringTeeth,
        currentStage.setupAdjustments.gears.pinionTeeth,
        currentStage.setupAdjustments.gears.quickChangeTopTeeth,
        currentStage.setupAdjustments.gears.quickChangeBottomTeeth,
      ),
    [
      currentStage.setupAdjustments.gears.pinionTeeth,
      currentStage.setupAdjustments.gears.quickChangeBottomTeeth,
      currentStage.setupAdjustments.gears.quickChangeTopTeeth,
      currentStage.setupAdjustments.gears.ringTeeth,
    ],
  );
  const gearRatio = formatGearRatio(gearRatioValue);
  const estimatedScaleEffect = useMemo(
    () =>
      calculateEstimatedScaleEffect({
        scaleLf: currentStage.setupAdjustments.chassis.scaleLf,
        scaleRf: currentStage.setupAdjustments.chassis.scaleRf,
        scaleLr: currentStage.setupAdjustments.chassis.scaleLr,
        scaleRr: currentStage.setupAdjustments.chassis.scaleRr,
        lfJackBoltTurns: currentStage.setupAdjustments.chassis.lfJackBoltTurns,
        rfJackBoltTurns: currentStage.setupAdjustments.chassis.rfJackBoltTurns,
        lrJackBoltTurns: currentStage.setupAdjustments.chassis.lrJackBoltTurns,
        rrJackBoltTurns: currentStage.setupAdjustments.chassis.rrJackBoltTurns,
        ballastChangeLbs: currentStage.setupAdjustments.chassis.ballastChangeLbs,
        ballastLocationZone: currentStage.setupAdjustments.chassis.ballastLocationZone,
        lfSpringChange: currentStage.setupAdjustments.chassis.lfSpringChange,
        rfSpringChange: currentStage.setupAdjustments.chassis.rfSpringChange,
        lrSpringChange: currentStage.setupAdjustments.chassis.lrSpringChange,
        rrSpringChange: currentStage.setupAdjustments.chassis.rrSpringChange,
        lfShockChange: currentStage.setupAdjustments.chassis.lfShockChange,
        rfShockChange: currentStage.setupAdjustments.chassis.rfShockChange,
        lrShockChange: currentStage.setupAdjustments.chassis.lrShockChange,
        rrShockChange: currentStage.setupAdjustments.chassis.rrShockChange,
      }),
    [currentStage.setupAdjustments.chassis],
  );
  const hasUnsavedChanges = useMemo(() => {
    if (!raceNight || !draftRaceNight) {
      return false;
    }

    return JSON.stringify(draftRaceNight) !== JSON.stringify(raceNight);
  }, [draftRaceNight, raceNight]);
  const isEditingRaceNightInput = focusedRaceNightInputCount > 0;
  const markLocalRaceNightEdit = React.useCallback(() => {
    recentLocalEditUntilRef.current = Date.now() + 6000;
  }, []);
  const handleRaceNightInputFocus = React.useCallback(() => {
    setFocusedRaceNightInputCount((current) => current + 1);
  }, []);
  const handleRaceNightInputBlur = React.useCallback(() => {
    setFocusedRaceNightInputCount((current) => Math.max(current - 1, 0));
  }, []);

  useEffect(() => {
    if (!raceNight) {
      return;
    }

    setDraftRaceNight((current) => {
      if (!current || current.id !== raceNight.id) {
        return raceNight;
      }

      if (isEditingRaceNightInput || Date.now() < recentLocalEditUntilRef.current) {
        return current;
      }

      const nextRaceNight = mergeRaceNightChecklistForDisplay(raceNight, raceNight);

      return JSON.stringify(nextRaceNight) === JSON.stringify(current) ? current : nextRaceNight;
    });
  }, [isEditingRaceNightInput, raceNight]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refreshSharedRaceNight = () => {
        if (hasUnsavedChanges || isEditingRaceNightInput || Date.now() < recentLocalEditUntilRef.current) {
          return;
        }

        void refreshRaceNight(raceNightId).catch((error) => {
          if (isActive) {
            console.warn("Unable to refresh shared race night on race-night screen.", error);
          }
        });
      };

      refreshSharedRaceNight();

      const interval = setInterval(refreshSharedRaceNight, 3000);

      return () => {
        isActive = false;
        clearInterval(interval);
      };
    }, [hasUnsavedChanges, isEditingRaceNightInput, raceNightId, refreshRaceNight]),
  );
  const rosterCurrentTeamRole = useMemo(() => {
    if (!userId) {
      return undefined;
    }

    return teamMembers.find((member) => member.userId === userId)?.role;
  }, [teamMembers, userId]);
  const canFinishRaceNight =
    isTeamOwner ||
    rosterCurrentTeamRole === "Owner" ||
    rosterCurrentTeamRole === "Driver" ||
    rosterCurrentTeamRole === "Crew Chief";
  const shouldShowFinishButton = activeStage === "aFeature";
  const isTotalLapsPromptActive = totalLapsTooltipStage === activeStage;
  const checklistCheckedByName = getFirstName(userName) ?? getFirstName(userEmail) ?? "Crew";
  const nextStage = useMemo(() => {
    const activeStageIndex = raceNightStageOrder.indexOf(activeStage);
    return raceNightStageOrder[activeStageIndex + 1];
  }, [activeStage]);
  const bottomStageButtonLabel =
    activeStage === "aFeature"
      ? "Finish Race Night"
      : nextStage
        ? `Next Stage: ${raceNightStageLabels[nextStage]}`
        : "Finish Race Night";
  const effectiveTabsHeaderHeight = Math.max(pinnedHeaderHeight, inlineTabsHeaderHeight);
  const effectiveStageTabsHeaderHeight = Math.max(pinnedStageTabsHeight, inlineStageTabsHeight);
  const scrollToSectionContent = React.useCallback((delay = 0, sectionId = activeSection) => {
    const runScroll = () => {
      const targetAnchorY =
        sectionId === "setups" && setupsSectionAnchorY > 0 ? setupsSectionAnchorY : sectionContentAnchorY;

      keyboardScrollRef.current?.scrollToPosition?.(
        0,
        Math.max(
          targetAnchorY - effectiveStageTabsHeaderHeight - spacing(0.5),
          0,
        ),
        false,
      );
    };

    if (delay > 0) {
      setTimeout(runScroll, delay);
      return;
    }

    runScroll();
  }, [
    activeSection,
    effectiveStageTabsHeaderHeight,
    sectionContentAnchorY,
    setupsSectionAnchorY,
  ]);
  const scrollToTotalLaps = React.useCallback((delay = 0) => {
    const runScroll = () => {
      keyboardScrollRef.current?.scrollToPosition?.(
        0,
        Math.max(
          totalLapsAnchorY - effectiveTabsHeaderHeight - spacing(0.5),
          0,
        ),
        false,
      );
    };

    if (delay > 0) {
      setTimeout(runScroll, delay);
      return;
    }

    runScroll();
  }, [effectiveTabsHeaderHeight, totalLapsAnchorY]);
  const handleScroll = React.useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const nextPinnedTabsVisible = offsetY >= Math.max(titleHeaderHeight - spacing(1), 0);

    if (nextPinnedTabsVisible !== pinnedTabsVisibleRef.current) {
      pinnedTabsVisibleRef.current = nextPinnedTabsVisible;
      setPinnedTabsVisible(nextPinnedTabsVisible);
    }
  }, [titleHeaderHeight]);
  const markUserScrolling = React.useCallback(() => {
    isUserScrollingRef.current = true;
    lastUserScrollAtRef.current = Date.now();
  }, []);
  const markUserScrollSettled = React.useCallback(() => {
    lastUserScrollAtRef.current = Date.now();

    setTimeout(() => {
      if (Date.now() - lastUserScrollAtRef.current >= 180) {
        isUserScrollingRef.current = false;
      }
    }, 200);
  }, []);

  useEffect(() => {
    if (!pendingStageScrollKey || pendingStageScrollKey !== `${activeStage}:${activeSection}`) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      scrollToSectionContent();
      setPendingStageScrollKey(undefined);
    });

    return () => cancelAnimationFrame(frame);
  }, [activeSection, activeStage, pendingStageScrollKey, scrollToSectionContent]);

  useEffect(() => {
    if (!pendingSectionScrollTarget || pendingSectionScrollTarget !== activeSection) {
      return;
    }

    if (pendingSectionScrollTarget === "setups" && setupsSectionAnchorY <= 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      scrollToSectionContent(0, pendingSectionScrollTarget);
      setPendingSectionScrollTarget(null);
    });

    return () => cancelAnimationFrame(frame);
  }, [activeSection, pendingSectionScrollTarget, scrollToSectionContent, setupsSectionAnchorY]);

  useEffect(() => {
    if (!totalLapsTooltipStage || activeStage !== totalLapsTooltipStage) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      scrollToTotalLaps();
      totalLapsInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [activeStage, scrollToTotalLaps, totalLapsTooltipStage]);

  useEffect(() => {
    if (!draftRaceNight || !hasUnsavedChanges || isReadOnly) {
      return;
    }

    const timeout = setTimeout(() => {
      if (isUserScrollingRef.current || Date.now() - lastUserScrollAtRef.current < 1200) {
        return;
      }

      void saveRaceNight(raceNightId, {
        ...draftRaceNight,
        lastViewedStage: activeStage,
      }).catch((error) => {
        console.warn("Unable to auto-save race night changes.", error);
      });
    }, 5000);

    return () => clearTimeout(timeout);
  }, [activeStage, draftRaceNight, hasUnsavedChanges, isReadOnly, raceNightId, saveRaceNight]);

  const handleStageFieldChange = (
    key: Exclude<keyof RaceNightStageData, "checklistSections" | "started" | "lapTimer" | "setupAdjustments">,
    value: string,
  ) => {
    markLocalRaceNightEdit();
    setDraftRaceNight((current) => {
      if (!current) {
        return current;
      }

      const nextStageSessions = {
        ...current.stageSessions,
        [activeStage]: {
          ...current.stageSessions[activeStage],
          started: true,
          [key]: value,
        },
      };

      if (activeStage === "hotLaps" && key === "weatherZipCode") {
        (["heat", "bFeature", "aFeature"] as RaceNightStageKey[]).forEach((stageKey) => {
          nextStageSessions[stageKey] = {
            ...nextStageSessions[stageKey],
            weatherZipCode: value,
          };
        });
      }

      return {
        ...current,
        stageSessions: nextStageSessions,
      };
    });
  };

  const handleWeatherAutofill = async () => {
    const zipCode = currentStage.weatherZipCode.trim();

    if (!/^\d{5}$/.test(zipCode)) {
      Alert.alert("Invalid ZIP Code", "Enter a 5-digit ZIP code first.");
      return;
    }

    setWeatherAutofillStage(activeStage);
    setWeatherAutofillMessage("");

    try {
      const zipResponse = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
      if (!zipResponse.ok) {
        throw new Error("Unable to find that ZIP code.");
      }

      const zipData = (await zipResponse.json()) as {
        places?: Array<{ latitude: string; longitude: string }>;
      };

      const firstPlace = zipData.places?.[0];
      if (!firstPlace?.latitude || !firstPlace.longitude) {
        throw new Error("Unable to find that ZIP code.");
      }

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${firstPlace.latitude}&longitude=${firstPlace.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,wind_gusts_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&forecast_days=1`,
      );

      if (!weatherResponse.ok) {
        throw new Error("Unable to load weather right now.");
      }

      const weatherData = (await weatherResponse.json()) as {
        current?: {
          temperature_2m?: number;
          relative_humidity_2m?: number;
          precipitation?: number;
          cloud_cover?: number;
          wind_speed_10m?: number;
          wind_gusts_10m?: number;
        };
      };

      const currentWeather = weatherData.current;
      if (!currentWeather) {
        throw new Error("Weather data is unavailable for that ZIP code.");
      }

      const precipitationValue = currentWeather.precipitation ?? 0;
      const cloudCoverValue = currentWeather.cloud_cover ?? 0;
      const windSpeedValue = currentWeather.wind_speed_10m ?? 0;
      const windGustValue = currentWeather.wind_gusts_10m ?? windSpeedValue;

      handleStageFieldChange(
        "weatherTemperature",
        currentWeather.temperature_2m != null ? `${Math.round(currentWeather.temperature_2m)}` : "",
      );
      handleStageFieldChange(
        "humidity",
        currentWeather.relative_humidity_2m != null
          ? `${Math.round(currentWeather.relative_humidity_2m)}`
          : "",
      );
      handleStageFieldChange(
        "windCondition",
        describeWindCondition(windSpeedValue, windGustValue),
      );
      handleStageFieldChange(
        "skyCondition",
        describeSkyCondition(cloudCoverValue),
      );
      handleStageFieldChange(
        "precipitation",
        describePrecipitation(precipitationValue),
      );

      setWeatherAutofillMessage(`Weather loaded for ZIP ${zipCode}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load weather right now.";
      Alert.alert("Weather Load Failed", message);
      setWeatherAutofillMessage(message);
    } finally {
      setWeatherAutofillStage(null);
    }
  };

  const handleSetupNoteChange = (value: string) => {
    markLocalRaceNightEdit();
    setDraftRaceNight((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        stageSessions: {
          ...current.stageSessions,
          [activeStage]: {
            ...current.stageSessions[activeStage],
            started: true,
            setupAdjustments: {
              ...current.stageSessions[activeStage].setupAdjustments,
              notes: value,
            },
          },
        },
      };
    });
  };

  const handleNestedSetupChange = <
    TKey extends "chassis" | "tires" | "suspension",
    TField extends keyof RaceNightStageData["setupAdjustments"][TKey],
  >(
    setupKey: TKey,
    fieldKey: TField,
    value: string,
  ) => {
    markLocalRaceNightEdit();
    setDraftRaceNight((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        stageSessions: {
          ...current.stageSessions,
          [activeStage]: {
            ...current.stageSessions[activeStage],
            started: true,
            setupAdjustments: {
              ...current.stageSessions[activeStage].setupAdjustments,
              [setupKey]: {
                ...current.stageSessions[activeStage].setupAdjustments[setupKey],
                [fieldKey]: value,
              },
            },
          },
        },
      };
    });
  };

  const handleChassisSetupChange = (fieldKey: ChassisFieldKey, value: string) => {
    markLocalRaceNightEdit();
    setDraftRaceNight((current) => {
      if (!current) {
        return current;
      }

      const nextChassis = {
        ...current.stageSessions[activeStage].setupAdjustments.chassis,
        [fieldKey]: value,
      };

      if (fieldKey === "scaleLf" || fieldKey === "scaleRf" || fieldKey === "scaleLr" || fieldKey === "scaleRr") {
        const calculated = calculateScalePercentages({
          lf: nextChassis.scaleLf,
          rf: nextChassis.scaleRf,
          lr: nextChassis.scaleLr,
          rr: nextChassis.scaleRr,
        });

        if (calculated) {
          nextChassis.crossweightWedge = calculated.crossweightWedge;
          nextChassis.leftSidePercentage = calculated.leftSidePercentage;
          nextChassis.rearPercentage = calculated.rearPercentage;
        }
      }

      return {
        ...current,
        stageSessions: {
          ...current.stageSessions,
          [activeStage]: {
            ...current.stageSessions[activeStage],
            started: true,
            setupAdjustments: {
              ...current.stageSessions[activeStage].setupAdjustments,
              chassis: nextChassis,
            },
          },
        },
      };
    });
  };

  const handleChassisMeasurementChange = (fieldKey: ChassisFieldKey, value: string) => {
    handleChassisSetupChange(fieldKey, sanitizeFractionMeasurementInput(value));
  };

  const handleChassisMeasurementBlur = (fieldKey: ChassisFieldKey) => {
    markLocalRaceNightEdit();
    setDraftRaceNight((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        stageSessions: {
          ...current.stageSessions,
          [activeStage]: {
            ...current.stageSessions[activeStage],
            started: true,
            setupAdjustments: {
              ...current.stageSessions[activeStage].setupAdjustments,
              chassis: {
                ...current.stageSessions[activeStage].setupAdjustments.chassis,
                [fieldKey]: normalizeFractionMeasurementInput(
                  current.stageSessions[activeStage].setupAdjustments.chassis[fieldKey],
                ),
              },
            },
          },
        },
      };
    });
  };

  const handleGearSetupChange = (fieldKey: keyof GearSetup, value: string) => {
    markLocalRaceNightEdit();
    setDraftRaceNight((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        stageSessions: {
          ...current.stageSessions,
          [activeStage]: {
            ...current.stageSessions[activeStage],
            started: true,
            setupAdjustments: {
              ...current.stageSessions[activeStage].setupAdjustments,
              gears: {
                ...current.stageSessions[activeStage].setupAdjustments.gears,
                [fieldKey]: value,
              },
            },
          },
        },
      };
    });
  };

  const handleOpenCircumferencePicker = (field: RaceNightTireCircumferenceFieldKey) => {
    setActiveCircumferenceField(field);
  };

  const handleSelectWholeNumber = (wholeNumber: string) => {
    setSelectedWholeNumber(wholeNumber);

    if (!activeCircumferenceField) {
      return;
    }

    if (selectedFraction === "0") {
      handleNestedSetupChange("tires", activeCircumferenceField, wholeNumber);
    }
  };

  const handleSelectFraction = (fraction: (typeof circumferenceFractionOptions)[number]) => {
    if (!activeCircumferenceField || !selectedWholeNumber) {
      return;
    }

    const nextValue = fraction === "0" ? selectedWholeNumber : `${selectedWholeNumber} ${fraction}`;
    handleNestedSetupChange("tires", activeCircumferenceField, nextValue);
    setSelectedFraction(fraction);
    setActiveCircumferenceField(null);
  };

  const handleChecklistToggle = (sectionId: string, itemId: string) => {
    if (!draftRaceNight) {
      return;
    }

    const nextDraftRaceNight = {
      ...draftRaceNight,
      stageSessions: {
        ...draftRaceNight.stageSessions,
        [activeStage]: {
          ...draftRaceNight.stageSessions[activeStage],
          started: true,
          checklistSections: draftRaceNight.stageSessions[activeStage].checklistSections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  items: section.items.map((item) =>
                    item.id === itemId
                      ? {
                          ...item,
                          checked: !item.checked,
                          checkedByName: item.checked ? undefined : checklistCheckedByName,
                        }
                      : item,
                  ),
                }
              : section,
          ),
        },
      },
    };

    setDraftRaceNight(nextDraftRaceNight);
    void saveRaceNight(raceNightId, nextDraftRaceNight).catch((error) => {
      const message = error instanceof Error ? error.message : "Unable to sync checklist change.";
      Alert.alert(
        "Checklist sync failed",
        `This checklist change was saved on this device, but it did not sync to the team yet.\n\n${message}`,
      );
    });
  };

  const handleTotalLapsChange = (value: string) => {
    const nextValue = value.replace(/[^0-9]/g, "");

    if (!draftRaceNight) {
      return;
    }

    markLocalRaceNightEdit();

    const nextDraftRaceNight = {
      ...draftRaceNight,
      stageSessions: {
        ...draftRaceNight.stageSessions,
        [activeStage]: {
          ...draftRaceNight.stageSessions[activeStage],
          started: true,
          totalLaps: nextValue,
        },
      },
    };

    setDraftRaceNight(nextDraftRaceNight);
    void saveRaceNight(raceNightId, nextDraftRaceNight).catch((error) => {
      console.warn("Unable to sync total laps change.", error);
    });
  };

  const handleWeatherZipChange = (value: string) => {
    handleStageFieldChange("weatherZipCode", value.replace(/[^0-9]/g, "").slice(0, 5));
  };

  const handleWeatherZipBlur = () => {
    handleRaceNightInputBlur();

    if (!draftRaceNight) {
      return;
    }

    void saveRaceNight(raceNightId, draftRaceNight).catch((error) => {
      console.warn("Unable to sync weather ZIP change.", error);
    });
  };

  const handleTotalLapsEditingComplete = () => {
    if (totalLapsTooltipStage !== activeStage) {
      return;
    }

    setTotalLapsTooltipStage(null);
    setPendingStageScrollKey(`${activeStage}:${activeSection}`);
  };

  const updateStageLapEntries = (
    updater: (entries: RaceNightStageData["lapTimer"]["entries"]) => RaceNightStageData["lapTimer"]["entries"],
  ) => {
    setDraftRaceNight((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        stageSessions: {
          ...current.stageSessions,
          [activeStage]: {
            ...current.stageSessions[activeStage],
            started: true,
            lapTimer: {
              entries: updater(current.stageSessions[activeStage].lapTimer.entries),
            },
          },
        },
      };
    });
  };

  const recordLapEntry = (shouldContinue: boolean) => {
    const runningElapsedMs = activeLiveTimer.isRunning
      ? activeLiveTimer.elapsedMs + (Date.now() - (activeLiveTimer.lapStartedAt ?? Date.now()))
      : activeLiveTimer.elapsedMs;

    if (runningElapsedMs <= 0) {
      return;
    }

    updateStageLapEntries((entries) => [
      ...entries,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        lapNumber: entries.filter((entry) => !entry.caution).length + 1,
        durationMs: runningElapsedMs,
        caution: activeLiveTimer.isCaution,
      },
    ]);

    setLiveTimers((current) => ({
      ...current,
      [activeStage]: {
        isRunning: shouldContinue,
        elapsedMs: 0,
        lapStartedAt: shouldContinue ? Date.now() : undefined,
        isCaution: false,
      },
    }));
  };

  const handleStartTimer = () => {
    setLiveTimers((current) => {
      if (current[activeStage].isRunning) {
        return current;
      }

      return {
        ...current,
        [activeStage]: {
          ...current[activeStage],
          isRunning: true,
          lapStartedAt: Date.now(),
          isCaution: false,
        },
      };
    });
  };

  const handleCaution = () => {
    if (activeStage === "hotLaps") {
      return;
    }

    setLiveTimers((current) => {
      if (!current[activeStage].isRunning) {
        return current;
      }

      return {
        ...current,
        [activeStage]: {
          ...current[activeStage],
          isCaution: true,
        },
      };
    });
  };

  const handleNewLap = () => {
    if (!activeLiveTimer.isRunning) {
      return;
    }

    recordLapEntry(true);
  };

  const handleStopTimer = () => {
    setLiveTimers((current) => {
      const stageTimer = current[activeStage];
      if (!stageTimer.isRunning) {
        return current;
      }

      return {
        ...current,
        [activeStage]: {
          isRunning: false,
          elapsedMs:
            stageTimer.elapsedMs + (Date.now() - (stageTimer.lapStartedAt ?? Date.now())),
          lapStartedAt: undefined,
          isCaution: stageTimer.isCaution,
        },
      };
    });
  };

  const handleCheckeredFlag = () => {
    Keyboard.dismiss();

    if (activeStage === "hotLaps") {
      return;
    }

    if (activeLiveTimer.isRunning || activeLiveTimer.elapsedMs > 0) {
      recordLapEntry(false);
    }

    startTransition(() => {
      setActiveSection("results");
    });
  };

  const handleSectionPress = (sectionId: (typeof raceNightSectionTabs)[number]["id"]) => {
    Keyboard.dismiss();

    startTransition(() => {
      setActiveSection(sectionId);
      setPendingSectionScrollTarget(sectionId);
    });
  };

  const handleSetupTabPress = (tabId: (typeof raceNightSetupTabs)[number]["id"]) => {
    Keyboard.dismiss();

    startTransition(() => {
      setActiveSetupTab(tabId);
    });
  };

  const handleStagePress = (nextStage: RaceNightStageKey) => {
    Keyboard.dismiss();

    if (nextStage === activeStage) {
      return;
    }

    const shouldShowTotalLapsTooltip =
      nextStage !== "hotLaps" &&
      !isReadOnly &&
      !draftRaceNight.stageSessions[nextStage].totalLaps.trim();

    let nextDraftRaceNight = draftRaceNight;

    if (nextDraftRaceNight) {
      const targetStage = nextDraftRaceNight.stageSessions[nextStage];

      if (!targetStage.started) {
        const nextStageIndex = raceNightStageOrder.indexOf(nextStage);
        const previousStartedStageKey = [...raceNightStageOrder]
          .slice(0, nextStageIndex)
          .reverse()
          .find((stageKey) => nextDraftRaceNight.stageSessions[stageKey].started);

        if (previousStartedStageKey) {
          const previousStage = nextDraftRaceNight.stageSessions[previousStartedStageKey];
          nextDraftRaceNight = {
            ...nextDraftRaceNight,
            stageSessions: {
              ...nextDraftRaceNight.stageSessions,
              [nextStage]: cloneStageData(previousStage),
            },
          };
        }
      }

      nextDraftRaceNight = {
        ...nextDraftRaceNight,
        lastViewedStage: nextStage,
      };

      setDraftRaceNight(nextDraftRaceNight);
      void saveRaceNight(raceNightId, nextDraftRaceNight);
    }

    startTransition(() => {
      setActiveStage(nextStage);
    });

    if (shouldShowTotalLapsTooltip) {
      setTotalLapsTooltipStage(nextStage);
      setPendingStageScrollKey(undefined);
      return;
    }

    setTotalLapsTooltipStage(null);
    setPendingStageScrollKey(`${nextStage}:${activeSection}`);
  };

  const handleSave = async (status?: RaceNight["status"]) => {
    try {
      await saveRaceNight(raceNightId, {
        ...draftRaceNight,
        lastViewedStage: activeStage,
        status: status ?? draftRaceNight.status,
        rainoutStage:
          status === "rainout"
            ? activeStage
            : status === "active"
              ? undefined
              : draftRaceNight.rainoutStage,
      });

      if (status === "rainout") {
        navigation.getParent()?.navigate("MainTabs", { screen: "Home" });
        return;
      }

      if (status === "completed") {
        navigation.getParent()?.navigate("PastRaces");
        return;
      }

      const activeStageIndex = raceNightStageOrder.indexOf(activeStage);
      const nextStage = raceNightStageOrder[activeStageIndex + 1];

      if (nextStage) {
        handleStagePress(nextStage);
        return;
      }

      navigation.getParent()?.navigate("PastRaces");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save the race night.";
      Alert.alert("Save failed", message);
    }
  };

    return (
      <View style={styles.container}>
        {pinnedTabsVisible ? (
        <View
          style={styles.fixedTabsHeader}
          onLayout={(event) => {
            setPinnedHeaderHeight(event.nativeEvent.layout.height);
          }}
        >
          <View style={styles.headerContent}>
            <View style={styles.stickyStageTabsWrap}>
          <View
            style={styles.tabCard}
            onLayout={(event) => {
              setPinnedStageTabsHeight(event.nativeEvent.layout.height);
            }}
          >
            <View style={styles.tabRow}>
              {raceNightStageOrder.map((stageKey) => (
                <Pressable
                  key={stageKey}
                  onPress={() => handleStagePress(stageKey)}
                  style={[
                    styles.stageTab,
                    activeStage === stageKey ? styles.stageTabActive : undefined,
                  ]}
                >
                  <Text
                    style={[
                      styles.stageTabText,
                      activeStage === stageKey ? styles.stageTabTextActive : undefined,
                    ]}
                  >
                    {stageKey === "heat" ? (
                      <Text
                        style={[
                          styles.stageTabTextStackedWrap,
                          activeStage === stageKey ? styles.stageTabTextActive : undefined,
                        ]}
                      >
                        <Text
                          style={[
                            styles.stageTabText,
                            styles.stageTabTextStackedTop,
                            activeStage === stageKey ? styles.stageTabTextActive : undefined,
                          ]}
                        >
                          Heat
                        </Text>
                        {"\n"}
                        <Text
                          style={[
                            styles.stageTabText,
                            styles.stageTabTextHeatBottom,
                            activeStage === stageKey ? styles.stageTabTextActive : undefined,
                          ]}
                        >
                          Race
                        </Text>
                      </Text>
                    ) : stageKey === "bFeature" || stageKey === "aFeature" ? (
                      <Text
                        style={[
                          styles.stageTabTextStackedWrap,
                          activeStage === stageKey ? styles.stageTabTextActive : undefined,
                        ]}
                      >
                        <Text
                          style={[
                            styles.stageTabText,
                            styles.stageTabTextStackedTop,
                            activeStage === stageKey ? styles.stageTabTextActive : undefined,
                          ]}
                        >
                          {stageKey === "bFeature" ? "B" : "A"}
                        </Text>
                        {"\n"}
                        <Text
                          style={[
                            styles.stageTabText,
                            styles.stageTabTextStackedBottom,
                            activeStage === stageKey ? styles.stageTabTextActive : undefined,
                          ]}
                        >
                          Feature
                        </Text>
                      </Text>
                    ) : (
                      raceNightStageLabels[stageKey]
                    )}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
            </View>
          </View>
        </View> 
        ) : null}
      <KeyboardScreen
        scrollRef={keyboardScrollRef}
        style={styles.scrollArea}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing(10) }]}
        onScroll={handleScroll}
        onScrollBeginDrag={markUserScrolling}
        onScrollEndDrag={markUserScrollSettled}
        onMomentumScrollEnd={markUserScrollSettled}
      >
        <View
          onLayout={(event) => {
            setTitleHeaderHeight(event.nativeEvent.layout.height);
          }}
        >
          <View style={styles.titleRow}>
            <Text style={styles.h1}>{draftRaceNight.eventTitle}</Text>
            <View style={styles.titleActionRow}>
              <Pressable
                accessibilityLabel="Edit race title"
                onPress={openTitleEditor}
                style={styles.titleEditButton}
              >
                <View style={styles.titleEditPencil}>
                  <View style={styles.titleEditPencilTip} />
                </View>
              </Pressable>
              <Pressable onPress={showRaceNightInstructions} style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>i</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.subhead}>
            {draftRaceNight.trackName} | {draftRaceNight.eventDate}
          </Text>
        </View>
        <View
          onLayout={(event) => {
            setInlineTabsHeaderHeight(event.nativeEvent.layout.height);
          }}
        >
          <View style={styles.stickyStageTabsWrap}>
            <View
              style={styles.tabCard}
              onLayout={(event) => {
                setInlineStageTabsHeight(event.nativeEvent.layout.height);
              }}
            >
              <View style={styles.tabRow}>
                {raceNightStageOrder.map((stageKey) => (
                  <Pressable
                    key={stageKey}
                    onPress={() => handleStagePress(stageKey)}
                    style={[
                      styles.stageTab,
                      activeStage === stageKey ? styles.stageTabActive : undefined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stageTabText,
                        activeStage === stageKey ? styles.stageTabTextActive : undefined,
                      ]}
                    >
                      {stageKey === "heat" ? (
                        <Text
                          style={[
                            styles.stageTabTextStackedWrap,
                            activeStage === stageKey ? styles.stageTabTextActive : undefined,
                          ]}
                        >
                          <Text
                            style={[
                              styles.stageTabText,
                              styles.stageTabTextStackedTop,
                              activeStage === stageKey ? styles.stageTabTextActive : undefined,
                            ]}
                          >
                            Heat
                          </Text>
                          {"\n"}
                          <Text
                            style={[
                              styles.stageTabText,
                              styles.stageTabTextHeatBottom,
                              activeStage === stageKey ? styles.stageTabTextActive : undefined,
                            ]}
                          >
                            Race
                          </Text>
                        </Text>
                      ) : stageKey === "bFeature" || stageKey === "aFeature" ? (
                        <Text
                          style={[
                            styles.stageTabTextStackedWrap,
                            activeStage === stageKey ? styles.stageTabTextActive : undefined,
                          ]}
                        >
                          <Text
                            style={[
                              styles.stageTabText,
                              styles.stageTabTextStackedTop,
                              activeStage === stageKey ? styles.stageTabTextActive : undefined,
                            ]}
                          >
                            {stageKey === "bFeature" ? "B" : "A"}
                          </Text>
                          {"\n"}
                          <Text
                            style={[
                              styles.stageTabText,
                              styles.stageTabTextStackedBottom,
                              activeStage === stageKey ? styles.stageTabTextActive : undefined,
                            ]}
                          >
                            Feature
                          </Text>
                        </Text>
                      ) : (
                        raceNightStageLabels[stageKey]
                      )}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            {!isTotalLapsPromptActive ? (
              <View style={styles.stickySectionTabsWrap}>
                <View style={styles.sectionTabsCard}>
                  <View style={styles.sectionTabsRow}>
                    {raceNightSectionTabs.map((section) => (
                      <Pressable
                        key={section.id}
                        onPress={() => handleSectionPress(section.id)}
                        style={[
                          styles.sectionTab,
                          activeSection === section.id ? styles.sectionTabActive : undefined,
                        ]}
                      >
                        <Text
                          style={[
                            styles.sectionTabText,
                            activeSection === section.id ? styles.sectionTabTextActive : undefined,
                          ]}
                        >
                          {section.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      {isReadOnly ? (
        <View style={styles.readOnlyBanner}>
          <Text style={styles.readOnlyBannerText}>
            {draftRaceNight.status === "rainout"
              ? `This race night was marked as a rainout during ${raceNightStageLabels[draftRaceNight.rainoutStage ?? activeStage]}. You can still update it or resume racing if the track starts back up.`
              : "All data is Read-Only on completed race nights and can't be edited."}
          </Text>
        </View>
      ) : null}
      {isStageLockedForPreRace ? (
        <View style={styles.stageLockBanner}>
          <Text style={styles.stageLockBannerText}>
            {raceNightStageLabels[activeStage]} stays locked until race day. Hot Laps carries your current baseline setup, and later stages will open with the previous stage&apos;s settings when the event date arrives.
          </Text>
        </View>
      ) : null}

      {!isHotLapsStage ? (
        <View
          onLayout={(event) => {
            setTotalLapsAnchorY(event.nativeEvent.layout.y);
          }}
        >
          <View style={styles.topRaceMetaRow}>
            <View style={styles.topRaceMetaCard}>
              <View style={styles.topRaceMetaInline}>
                <Text style={styles.topRaceMetaLabelInline}>Total Laps</Text>
                <TextInput
                  ref={totalLapsInputRef}
                  value={currentStage.totalLaps}
                  onChangeText={handleTotalLapsChange}
                  onFocus={handleRaceNightInputFocus}
                  onBlur={handleRaceNightInputBlur}
                  onEndEditing={handleTotalLapsEditingComplete}
                  onSubmitEditing={handleTotalLapsEditingComplete}
                  placeholder=""
                  placeholderTextColor="#5E7B94"
                  keyboardType="number-pad"
                  returnKeyType="done"
                  blurOnSubmit
                  editable={!isStageInputDisabled}
                  style={styles.topRaceMetaInput}
                />
              </View>
            </View>
          </View>
          {totalLapsTooltipStage === activeStage ? (
            <View style={styles.inlineTooltipWrap}>
              <View style={styles.inlineTooltipPointer} />
              <View style={styles.inlineTooltipCard}>
                <Text style={styles.inlineTooltipTitle}>{getTotalLapsTooltipLabel(activeStage)}</Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
      {!isReadOnly ? (
        <Pressable
          onPress={() => {
            Keyboard.dismiss();

            if (draftRaceNight.status === "rainout") {
              Alert.alert(
                "Resume Racing?",
                "This will change the race night back to active so you can keep using it if racing resumes.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Yes",
                    onPress: () => {
                      void handleSave("active");
                    },
                  },
                ],
              );
              return;
            }

            Alert.alert(
              "Mark Race Night As Rainout?",
              `This will mark the race night as a rainout during ${raceNightStageLabels[activeStage]}. You can resume it later if the track starts racing again.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes",
                  onPress: () => {
                    void handleSave("rainout");
                  },
                },
              ],
            );
          }}
          style={styles.rainoutButton}
        >
          <Text style={styles.rainoutButtonText}>
            {draftRaceNight.status === "rainout" ? "Resume Racing" : "Rainout"}
          </Text>
        </Pressable>
      ) : null}

      <View
        onLayout={(event) => {
          setSectionContentAnchorY(event.nativeEvent.layout.y);
        }}
      />

        {activeSection === "weather" ? (
          <Pressable onPress={Keyboard.dismiss} style={styles.card}>
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.sectionTitle}>Weather</Text>
            </Pressable>
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.weatherSectionHelper}>
                Enter the ZIP code for weather before loading conditions for this stage.
              </Text>
            </Pressable>
            <View pointerEvents={isStageInputDisabled ? "none" : "auto"}>
              <View style={styles.weatherAutofillRow}>
                <View style={styles.weatherControlHalf}>
                  <TextInput
                    value={currentStage.weatherZipCode}
                    onChangeText={handleWeatherZipChange}
                    onFocus={handleRaceNightInputFocus}
                    onBlur={handleWeatherZipBlur}
                    placeholder="ZIP Code"
                    placeholderTextColor="#5E7B94"
                    keyboardType="numeric"
                    editable={isWeatherZipEditable}
                    maxLength={5}
                    style={[
                      styles.weatherZipInput,
                      styles.weatherZipPlaceholderSized,
                      !isWeatherZipEditable ? styles.weatherZipInputLocked : undefined,
                    ]}
                  />
                </View>
                <View style={styles.weatherControlHalf}>
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      void handleWeatherAutofill();
                    }}
                    style={[
                      styles.weatherAutofillButton,
                      weatherAutofillStage === activeStage ? styles.weatherAutofillButtonDisabled : undefined,
                    ]}
                    disabled={weatherAutofillStage === activeStage || isReadOnly}
                  >
                    <Text style={styles.weatherAutofillButtonText}>
                      {weatherAutofillStage === activeStage ? "Refreshing..." : weatherActionLabel}
                    </Text>
                  </Pressable>
                </View>
              </View>
              {weatherAutofillMessage ? (
                <Text style={styles.weatherAutofillStatus}>{weatherAutofillMessage}</Text>
              ) : null}
            <View style={styles.grid}>
              <Field
                label="Temperature"
                value={currentStage.weatherTemperature}
                onChangeText={(value) => handleStageFieldChange("weatherTemperature", value)}
                placeholder="72"
                keyboardType="decimal-pad"
                halfWidth
              />
              <Field
                label="Humidity %"
                value={currentStage.humidity}
                onChangeText={(value) => handleStageFieldChange("humidity", value)}
                placeholder="58"
                keyboardType="decimal-pad"
                halfWidth
              />
            </View>
            <Field
              label="Wind"
              value={currentStage.windCondition}
              onChangeText={(value) => handleStageFieldChange("windCondition", value)}
              placeholder="Calm, breezy, windy"
            />
            <Field
              label="Sky"
              value={currentStage.skyCondition}
              onChangeText={(value) => handleStageFieldChange("skyCondition", value)}
              placeholder="Sunny, cloudy, overcast"
            />
            <Field
              label="Precipitation"
              value={currentStage.precipitation}
              onChangeText={(value) => handleStageFieldChange("precipitation", value)}
              placeholder="Dry, rainy, misting"
            />
            <Field
              label="Weather Notes"
              value={currentStage.weatherNotes}
              onChangeText={(value) => handleStageFieldChange("weatherNotes", value)}
              placeholder="Track cooled off after sunset..."
              multiline
            />
          </View>
          </Pressable>
        ) : null}

      {activeSection === "track" ? (
        <Pressable onPress={Keyboard.dismiss} style={styles.card}>
          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.sectionTitle}>Track Condition</Text>
          </Pressable>
          <View pointerEvents={isStageInputDisabled ? "none" : "auto"}>
            <Field
              label="Track Temp"
              value={currentStage.trackTemperature}
              onChangeText={(value) => handleStageFieldChange("trackTemperature", value)}
              placeholder="84"
              keyboardType="decimal-pad"
            />
            <Field
              label="Track Type"
              value={currentStage.trackType}
              onChangeText={(value) => handleStageFieldChange("trackType", value)}
              placeholder="Dirt Oval"
            />
            <View style={styles.grid}>
              <Field
                label="Track Banking"
                value={currentStage.trackBanking}
                onChangeText={(value) => handleStageFieldChange("trackBanking", value)}
                placeholder="High-Bank, Semi-Bank, Flat"
                halfWidth
              />
              <Field
                label="Track Length"
                value={currentStage.trackLength}
                onChangeText={(value) => handleStageFieldChange("trackLength", value)}
                placeholder="1/4, 3/8, 1/2..."
                halfWidth
              />
            </View>
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.readOnlyHelper}>
                If this event track matches one of your saved tracks, track type, banking, and length should auto-fill when race night starts.
              </Text>
            </Pressable>
            <Field
              label="Surface"
              value={currentStage.trackSurface}
              onChangeText={(value) => handleStageFieldChange("trackSurface", value)}
              placeholder="Wet, heavy, tacky, slick"
            />
            <Field
              label="Moisture / Grip"
              value={currentStage.moistureState}
              onChangeText={(value) => handleStageFieldChange("moistureState", value)}
              placeholder="Heavy, drying, dry slick"
            />
            <Field
              label="Track Notes"
              value={currentStage.trackNotes}
              onChangeText={(value) => handleStageFieldChange("trackNotes", value)}
              placeholder="Bottom is hooked up, cushion moved to the wall..."
              multiline
            />
          </View>
        </Pressable>
      ) : null}

      {activeSection === "checklist" ? (
        <View style={styles.card}>
          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.sectionTitle}>Checklist</Text>
          </Pressable>
          <View pointerEvents={isStageInputDisabled ? "none" : "auto"}>
            {currentStage.checklistSections.map((section) => (
              <View key={`${activeStage}-${section.id}`} style={styles.checklistSection}>
                <Text style={styles.checklistTitle}>{section.title}</Text>
                {section.items.map((item) => (
                  <Pressable
                    key={`${activeStage}-${section.id}-${item.id}`}
                    onPress={() => handleChecklistToggle(section.id, item.id)}
                    style={styles.checklistRow}
                  >
                    <View style={[styles.checkbox, item.checked ? styles.checkboxChecked : undefined]} />
                    <Text style={styles.checklistLabel}>
                      {item.label}
                      {item.checked && item.checkedByName ? (
                        <Text style={styles.checklistCheckedBy}> ({item.checkedByName})</Text>
                      ) : null}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {activeSection === "setups" ? (
        <View
          style={styles.card}
          onLayout={(event) => {
            setSetupsSectionAnchorY(event.nativeEvent.layout.y);
          }}
        >
          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.sectionTitle}>Setups</Text>
          </Pressable>
          <View style={styles.setupTabsRow}>
            {raceNightSetupTabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => handleSetupTabPress(tab.id)}
                style={[
                  styles.setupTab,
                  activeSetupTab === tab.id ? styles.setupTabActive : undefined,
                ]}
              >
                <Text
                  style={[
                    styles.setupTabText,
                    activeSetupTab === tab.id ? styles.setupTabTextActive : undefined,
                  ]}
                >
                  {tab.id === "frontSuspension"
                    ? "Front\nSuspension"
                    : tab.id === "rearSuspension"
                      ? "Rear\nSuspension"
                      : tab.id === "gears" && draftRaceNight.raceCarType === "Sprint Car"
                        ? "Driveline"
                        : tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View pointerEvents={isStageInputDisabled ? "none" : "auto"}>
            {activeSetupTab === "chassis" ? (
              <>
                <View style={styles.grid}>
                  {raceNightChassisFields.map((field) => (
                    <Field
                      key={`${activeStage}-${field.key}`}
                      label={field.label}
                      value={currentStage.setupAdjustments.chassis[field.key]}
                      onChangeText={(value) => handleChassisMeasurementChange(field.key, value)}
                      onBlur={() => handleChassisMeasurementBlur(field.key)}
                      placeholder={field.placeholder}
                      keyboardType={field.keyboardType}
                      halfWidth
                    />
                  ))}
                </View>
                {isWingSprintCar ? (
                  <View style={styles.grid}>
                    {raceNightWingSprintFields.map((field) => (
                      <Field
                        key={`${activeStage}-${field.key}`}
                        label={field.label}
                        value={currentStage.setupAdjustments.chassis[field.key]}
                        onChangeText={(value) => handleChassisSetupChange(field.key, value)}
                        placeholder={field.placeholder}
                      />
                    ))}
                  </View>
                ) : null}
                <View style={styles.grid}>
                  {raceNightScaleWeightFields.map((field) => (
                    <Field
                      key={`${activeStage}-${field.key}`}
                      label={field.label}
                      value={currentStage.setupAdjustments.chassis[field.key]}
                      onChangeText={(value) => handleChassisSetupChange(field.key, value)}
                      placeholder={field.placeholder}
                      keyboardType="decimal-pad"
                      halfWidth
                    />
                  ))}
                </View>
                <Pressable onPress={Keyboard.dismiss}>
                  <Text style={styles.readOnlyHelper}>
                    Enter updated corner scale weights and the percentage fields below will auto-fill.
                  </Text>
                </Pressable>
                <View style={styles.grid}>
                  {raceNightCalculatedPercentFields.slice(0, 2).map((field) => (
                    <Field
                      key={`${activeStage}-${field.key}`}
                      label={field.label}
                      value={currentStage.setupAdjustments.chassis[field.key]}
                      onChangeText={() => {}}
                      placeholder={field.placeholder}
                      keyboardType="decimal-pad"
                      editable={false}
                      halfWidth
                    />
                  ))}
                </View>
                <View style={styles.centeredFieldWrap}>
                  <Field
                    label={raceNightCalculatedPercentFields[2].label}
                    value={currentStage.setupAdjustments.chassis[raceNightCalculatedPercentFields[2].key]}
                    onChangeText={() => {}}
                    placeholder={raceNightCalculatedPercentFields[2].placeholder}
                    keyboardType="decimal-pad"
                    editable={false}
                  />
                </View>
                <Text style={styles.adjustmentSubTitle}>Jack Bolt</Text>
                <View style={styles.grid}>
                  {raceNightJackBoltFields.map((field) => (
                    <Field
                      key={`${activeStage}-${field.key}`}
                      label={field.label}
                      value={currentStage.setupAdjustments.chassis[field.key]}
                      onChangeText={(value) => handleChassisSetupChange(field.key, value)}
                      placeholder={field.placeholder}
                      keyboardType="decimal-pad"
                      halfWidth
                    />
                  ))}
                </View>
                <Text style={styles.adjustmentSubTitle}>Springs</Text>
                <View style={styles.grid}>
                  {raceNightSpringChangeFields.map((field) => (
                    <Field
                      key={`${activeStage}-${field.key}`}
                      label={field.label}
                      value={currentStage.setupAdjustments.chassis[field.key]}
                      onChangeText={(value) => handleChassisSetupChange(field.key, value)}
                      placeholder={field.placeholder}
                      keyboardType="decimal-pad"
                      halfWidth
                    />
                  ))}
                </View>
                <Text style={styles.adjustmentSubTitle}>Shocks</Text>
                <View style={styles.grid}>
                  {raceNightShockChangeFields.map((field) => (
                    <Field
                      key={`${activeStage}-${field.key}`}
                      label={field.label}
                      value={currentStage.setupAdjustments.chassis[field.key]}
                      onChangeText={(value) => handleChassisSetupChange(field.key, value)}
                      placeholder={field.placeholder}
                      keyboardType="decimal-pad"
                      halfWidth
                    />
                  ))}
                </View>
                <Text style={styles.adjustmentSubTitle}>Ballast</Text>
                <View style={styles.grid}>
                  <Field
                    label="Ballast Change Lbs"
                    value={currentStage.setupAdjustments.chassis.ballastChangeLbs}
                    onChangeText={(value) => handleChassisSetupChange("ballastChangeLbs", value)}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    halfWidth
                  />
                  <Field
                    label="Ballast Location Zone"
                    value={currentStage.setupAdjustments.chassis.ballastLocationZone}
                    onChangeText={(value) => handleChassisSetupChange("ballastLocationZone", value)}
                    placeholder="LF, LR, Left, Rear..."
                    halfWidth
                  />
                </View>
                <Pressable onPress={Keyboard.dismiss} style={styles.estimateCard}>
                  <Text style={styles.estimateTitle}>Estimated Scale Effect</Text>
                  {estimatedScaleEffect ? (
                    <>
                      <View style={styles.grid}>
                        <Field
                          label="Estimated Cross"
                          value={`${estimatedScaleEffect.estimatedCrossweightWedge}%`}
                          onChangeText={() => {}}
                          placeholder="-"
                          editable={false}
                          halfWidth
                        />
                        <Field
                          label="Estimated Left"
                          value={`${estimatedScaleEffect.estimatedLeftSidePercentage}%`}
                          onChangeText={() => {}}
                          placeholder="-"
                          editable={false}
                          halfWidth
                        />
                      </View>
                      <View style={styles.centeredFieldWrap}>
                        <Field
                          label="Estimated Rear"
                          value={`${estimatedScaleEffect.estimatedRearPercentage}%`}
                          onChangeText={() => {}}
                          placeholder="-"
                          editable={false}
                        />
                      </View>
                      {estimatedScaleEffect.handlingNotes.length ? (
                        <View style={styles.effectNotes}>
                          {estimatedScaleEffect.handlingNotes.map((note) => (
                            <Text key={note} style={styles.effectNoteText}>
                              {note}
                            </Text>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.readOnlyHelper}>
                          Add adjustment inputs above to see estimated handling trends.
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text style={styles.readOnlyHelper}>
                      Enter all four scale weights first, then the app can estimate how the changes may shift percentages.
                    </Text>
                  )}
                </Pressable>
                {raceNightChassisNoteFields.map((field) => (
                  <Field
                    key={`${activeStage}-${field.key}`}
                    label={field.label}
                    value={currentStage.setupAdjustments.chassis[field.key]}
                    onChangeText={(value) => handleChassisSetupChange(field.key, value)}
                    placeholder={field.placeholder}
                    multiline
                  />
                ))}
              </>
            ) : null}

            {activeSetupTab === "tires" ? (
              <>
                <View style={styles.grid}>
                  {raceNightTireFields
                    .filter((field) => field.key.includes("Circumference"))
                    .map((field) => (
                      <View
                        key={`${activeStage}-${field.key}`}
                        style={[styles.fieldBlock, styles.fieldBlockHalf]}
                      >
                        <Text style={styles.label}>{field.label}</Text>
                        <Pressable
                          onPress={() =>
                            handleOpenCircumferencePicker(field.key as RaceNightTireCircumferenceFieldKey)
                          }
                          style={[styles.input, styles.circumferenceButton]}
                        >
                          <Text
                            style={
                              currentStage.setupAdjustments.tires[field.key]
                                ? styles.inputValue
                                : styles.inputPlaceholder
                            }
                          >
                            {currentStage.setupAdjustments.tires[field.key] || field.placeholder}
                          </Text>
                        </Pressable>
                      </View>
                    ))}
                </View>
                <View style={styles.staggerRow}>
                  <View style={styles.staggerCard}>
                    <Text style={styles.staggerLabel}>
                      Front
                      {"\n"}
                      Stagger
                    </Text>
                    <Text style={styles.staggerValue}>{frontStagger}</Text>
                    <Text style={styles.staggerHint}>RF minus LF</Text>
                  </View>
                  <View style={styles.staggerCard}>
                    <Text style={styles.staggerLabel}>
                      Rear
                      {"\n"}
                      Stagger
                    </Text>
                    <Text style={styles.staggerValue}>{rearStagger}</Text>
                    <Text style={styles.staggerHint}>RR minus LR</Text>
                  </View>
                </View>
                <View style={styles.grid}>
                  {raceNightTireFields
                    .filter((field) => field.key.includes("Pressure"))
                    .map((field) => (
                      <Field
                        key={`${activeStage}-${field.key}`}
                        label={field.label}
                        value={currentStage.setupAdjustments.tires[field.key]}
                        onChangeText={(value) => handleNestedSetupChange("tires", field.key, value)}
                        placeholder={field.placeholder}
                        keyboardType={field.keyboardType}
                        halfWidth
                      />
                  ))}
                </View>
                <View style={styles.grid}>
                  {raceNightWheelOffsetFields.map((field) => (
                    <Field
                      key={`${activeStage}-${field.key}`}
                      label={field.label}
                      value={currentStage.setupAdjustments.tires[field.key]}
                      onChangeText={(value) =>
                        handleNestedSetupChange("tires", field.key, sanitizeFractionMeasurementInput(value))
                      }
                      onBlur={() =>
                        handleNestedSetupChange(
                          "tires",
                          field.key,
                          normalizeFractionMeasurementInput(currentStage.setupAdjustments.tires[field.key]),
                        )
                      }
                      placeholder={field.placeholder}
                      keyboardType={field.keyboardType}
                      halfWidth
                    />
                  ))}
                </View>
                {!isHotLapsStage ? (
                  <>
                    <Text style={styles.setupSubSectionTitle}>Tire Temps</Text>
                    <View style={styles.grid}>
                      {raceNightTireTempCorners.map((corner) => (
                        <View
                          key={`${activeStage}-${corner.id}`}
                          style={[styles.fieldBlock, styles.fieldBlockHalf, styles.tempCornerCard]}
                        >
                          <Text style={styles.tempCornerTitle}>{corner.label}</Text>
                          <Field
                            label="Inner"
                            value={currentStage.setupAdjustments.tires[corner.innerKey]}
                            onChangeText={(value) =>
                              handleNestedSetupChange(
                                "tires",
                                corner.innerKey,
                                value.replace(/[^0-9.]/g, ""),
                              )
                            }
                            placeholder="90"
                            keyboardType="decimal-pad"
                          />
                          <Field
                            label="Middle"
                            value={currentStage.setupAdjustments.tires[corner.middleKey]}
                            onChangeText={(value) =>
                              handleNestedSetupChange(
                                "tires",
                                corner.middleKey,
                                value.replace(/[^0-9.]/g, ""),
                              )
                            }
                            placeholder="92"
                            keyboardType="decimal-pad"
                          />
                          <Field
                            label="Outer"
                            value={currentStage.setupAdjustments.tires[corner.outerKey]}
                            onChangeText={(value) =>
                              handleNestedSetupChange(
                                "tires",
                                corner.outerKey,
                                value.replace(/[^0-9.]/g, ""),
                              )
                            }
                            placeholder="94"
                            keyboardType="decimal-pad"
                          />
                          <View style={styles.tempAverageRow}>
                            <Text style={styles.tempAverageLabel}>Avg Temp</Text>
                            <Text style={styles.tempAverageValue}>
                              {tireTempAverages[corner.id]}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}
              </>
            ) : null}

            {activeSetupTab === "frontSuspension" ? (
              <>
                {raceNightFrontSuspensionFields.map((field) => (
                  <Field
                    key={`${activeStage}-${field.key}`}
                    label={field.label}
                    value={currentStage.setupAdjustments.suspension[field.key]}
                    onChangeText={(value) => handleNestedSetupChange("suspension", field.key, value)}
                    placeholder={field.placeholder}
                    multiline={field.multiline}
                  />
                ))}
              </>
            ) : null}

            {activeSetupTab === "rearSuspension" ? (
              <>
                {raceNightRearSuspensionFields.map((field) => (
                  <Field
                    key={`${activeStage}-${field.key}`}
                    label={field.label}
                    value={currentStage.setupAdjustments.suspension[field.key]}
                    onChangeText={(value) => handleNestedSetupChange("suspension", field.key, value)}
                    placeholder={field.placeholder}
                    multiline={field.multiline}
                  />
                ))}
              </>
            ) : null}

            {activeSetupTab === "gears" ? (
              <>
                <View style={styles.grid}>
                  {raceNightGearFields
                    .filter((field) => field.halfWidth)
                    .map((field) => (
                      <Field
                        key={`${activeStage}-${field.key}`}
                        label={field.label}
                        value={currentStage.setupAdjustments.gears[field.key]}
                        onChangeText={(value) =>
                          handleGearSetupChange(field.key, value.replace(/[^0-9.]/g, ""))
                        }
                        placeholder={field.placeholder}
                        keyboardType="number-pad"
                        halfWidth
                      />
                    ))}
                </View>
                <View style={styles.staggerCard}>
                  <Text style={styles.gearRatioLabel}>Final Drive Ratio</Text>
                  <Text style={styles.gearRatioValue}>{gearRatio}</Text>
                  <Text style={styles.staggerHint}>
                    Ring/pinion ratio multiplied by top quick-change gear divided by bottom quick-change gear
                  </Text>
                </View>
                {raceNightGearFields
                  .filter((field) => !field.halfWidth)
                  .map((field) => (
                    <Field
                      key={`${activeStage}-${field.key}`}
                      label={field.label}
                      value={currentStage.setupAdjustments.gears[field.key]}
                      onChangeText={(value) => handleGearSetupChange(field.key, value)}
                      placeholder={field.placeholder}
                      multiline
                    />
                  ))}
              </>
            ) : null}
          </View>
        </View>
      ) : null}

      {activeSection === "lapTimes" ? (
        <View style={styles.card}>
          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.sectionTitle}>Stopwatch & Lap Times</Text>
          </Pressable>
          <View pointerEvents={isStageInputDisabled ? "none" : "auto"}>
            <View style={styles.stopwatchTopRow}>
              <View style={styles.stopwatchStatCard}>
                <Text style={styles.stopwatchStatLabel}>{getStopwatchStageLabel(activeStage)}</Text>
                <Text style={styles.stopwatchStatValue}>
                  {isHotLapsStage
                    ? `Laps: ${displayedLapNumber}`
                    : `Laps: ${displayedLapNumber} of ${currentStage.totalLaps || "0"}`}
                </Text>
              </View>
              <View style={styles.stopwatchStatCard}>
                <Text style={styles.stopwatchStatLabel}>Fastest Time</Text>
                <Text style={styles.stopwatchStatValue}>
                  {fastestLap ? formatDuration(fastestLap.durationMs) : "-"}
                </Text>
              </View>
            </View>

            <View style={styles.stopwatchTopRow}>
              <View style={styles.stopwatchStatCard}>
                <Text style={styles.stopwatchStatLabel}>Total Race Time</Text>
                <Text style={styles.stopwatchStatValue}>{formatDuration(totalRaceTimeMs)}</Text>
              </View>
            </View>

            <View style={styles.stopwatchDisplay}>
              <Text style={styles.stopwatchRaceTitle}>{getStopwatchStageLabel(activeStage)}</Text>
              <Text style={styles.stopwatchTime}>{formatDuration(elapsedCurrentLapMs)}</Text>
              <Text style={styles.stopwatchSubhead}>
                {activeLiveTimer.isRunning
                  ? activeLiveTimer.isCaution
                    ? "Caution rolling"
                    : "Current lap live"
                  : "Ready for next lap"}
              </Text>
            </View>

            <View style={styles.stopwatchActions}>
              <Pressable onPress={handleStartTimer} style={[styles.stopwatchButton, styles.startButton]}>
                <Text style={styles.stopwatchButtonText}>Start</Text>
              </Pressable>
              <Pressable
                onPress={handleNewLap}
                style={[
                  styles.stopwatchButton,
                  styles.lapButton,
                  !activeLiveTimer.isRunning ? styles.stopwatchButtonDisabled : undefined,
                ]}
                disabled={!activeLiveTimer.isRunning}
              >
                <Text style={styles.stopwatchButtonText}>New Lap</Text>
              </Pressable>
              <Pressable
                onPress={handleCaution}
                style={[
                  styles.stopwatchButton,
                  styles.cautionButton,
                  isHotLapsStage || !activeLiveTimer.isRunning ? styles.stopwatchButtonDisabled : undefined,
                ]}
                disabled={isHotLapsStage || !activeLiveTimer.isRunning}
              >
                <Text style={styles.cautionButtonText}>Caution</Text>
              </Pressable>
              <Pressable
                onPress={handleStopTimer}
                style={[
                  styles.stopwatchButton,
                  styles.stopButton,
                  !activeLiveTimer.isRunning ? styles.stopwatchButtonDisabled : undefined,
                ]}
                disabled={!activeLiveTimer.isRunning}
              >
                <Text style={styles.stopwatchButtonText}>Stop</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleCheckeredFlag}
              style={[styles.checkeredButton, isHotLapsStage ? styles.stopwatchButtonDisabled : undefined]}
              disabled={isHotLapsStage}
            >
              <Text style={styles.checkeredButtonText}>Checkered Flag</Text>
            </Pressable>

            {activeLiveTimer.isCaution ? (
              <View style={styles.lapRow}>
                <View style={styles.lapRowCopy}>
                  <Text style={styles.lapRowTitle}>Caution</Text>
                  <Text style={styles.lapRowTime}>{formatDuration(elapsedCurrentLapMs)}</Text>
                </View>
                <View style={[styles.cautionChip, styles.cautionChipActive]}>
                  <Text style={styles.cautionChipText}>Live</Text>
                </View>
              </View>
            ) : null}

            {currentStage.lapTimer.entries.length ? (
              currentStage.lapTimer.entries.map((entry) => (
                <View key={entry.id} style={styles.lapRow}>
                  <View style={styles.lapRowCopy}>
                    <Text style={styles.lapRowTitle}>
                      {entry.caution ? "Caution" : `Lap ${entry.lapNumber}`}
                    </Text>
                    <Text style={styles.lapRowTime}>{formatDuration(entry.durationMs)}</Text>
                  </View>
                  {entry.caution ? (
                    <View style={[styles.cautionChip, styles.cautionChipActive]}>
                      <Text style={styles.cautionChipText}>Caution</Text>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.emptyLapText}>
                {isHotLapsStage
                  ? "No laps recorded yet. Use Start and New Lap as the hot laps get under way."
                  : "No laps recorded yet. Set total laps at the top of this stage, then use Start and New Lap as the race unfolds."}
              </Text>
            )}
          </View>
        </View>
      ) : null}

      {activeSection === "results" ? (
        <View style={styles.card}>
          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.sectionTitle}>Positions & Notes</Text>
          </Pressable>
          <View pointerEvents={isStageInputDisabled ? "none" : "auto"}>
            <View style={styles.grid}>
              <Field
                label="Start Position"
                value={currentStage.startPosition}
                onChangeText={(value) => handleStageFieldChange("startPosition", value)}
                placeholder={isHotLapsStage ? "N/A" : "4"}
                keyboardType="number-pad"
                editable={!isHotLapsStage}
                halfWidth
              />
              <Field
                label="Finish Position"
                value={currentStage.finishPosition}
                onChangeText={(value) => handleStageFieldChange("finishPosition", value)}
                placeholder={isHotLapsStage ? "N/A" : "2"}
                keyboardType="number-pad"
                editable={!isHotLapsStage}
                halfWidth
              />
            </View>
            {isHotLapsStage ? (
              <Pressable onPress={Keyboard.dismiss}>
                <Text style={styles.readOnlyHelper}>
                  Hot Laps does not use starting or finishing position, so those fields stay disabled on
                  this tab.
                </Text>
              </Pressable>
            ) : null}
            <Field
              label="Setup Notes"
              value={currentStage.setupAdjustments.notes}
              onChangeText={handleSetupNoteChange}
              placeholder="Anything else about the setup for this stage..."
              multiline
            />
            <Field
              label="Driver Notes"
              value={currentStage.driverNotes}
              onChangeText={(value) => handleStageFieldChange("driverNotes", value)}
              placeholder="Tight center on heat, better on feature exit..."
              multiline
            />
            <Field
              label="Crew Notes"
              value={currentStage.crewNotes}
              onChangeText={(value) => handleStageFieldChange("crewNotes", value)}
              placeholder="Track changed after intermission..."
              multiline
            />
          </View>
        </View>
      ) : null}

      {!isReadOnly && (!shouldShowFinishButton || canFinishRaceNight) ? (
        <>
          <AppPressable
            onPress={() => {
              Keyboard.dismiss();
              if (activeStage === "aFeature") {
                void handleSave("completed");
                return;
              }

              if (nextStage) {
                handleStagePress(nextStage);
              }
            }}
            style={[styles.primaryButton, { marginBottom: insets.bottom + spacing(10) }]}
          >
            <Text style={styles.primaryButtonText}>{bottomStageButtonLabel}</Text>
          </AppPressable>
        </>
      ) : null}

      <Modal
        visible={!!activeCircumferenceField}
        animationType="fade"
        transparent
        onRequestClose={() => setActiveCircumferenceField(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Circumference</Text>
            <Text style={styles.modalHelp}>
              Pick the whole number first, then tap the fraction to finish the measurement.
            </Text>

            <Text style={styles.modalSectionLabel}>Whole Number</Text>
            <View style={styles.optionGrid}>
              {circumferenceWholeNumberOptions.map((wholeNumber) => {
                const isSelected = selectedWholeNumber === wholeNumber;
                return (
                  <Pressable
                    key={wholeNumber}
                    onPress={() => handleSelectWholeNumber(wholeNumber)}
                    style={[styles.optionChip, isSelected ? styles.optionChipActive : undefined]}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        isSelected ? styles.optionChipTextActive : undefined,
                      ]}
                    >
                      {wholeNumber}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.modalSectionLabel}>Fraction</Text>
            <View style={styles.optionGrid}>
              {circumferenceFractionOptions.map((fraction) => {
                const isSelected = selectedFraction === fraction;
                return (
                  <Pressable
                    key={fraction}
                    onPress={() => handleSelectFraction(fraction)}
                    style={[
                      styles.optionChip,
                      !selectedWholeNumber ? styles.optionChipDisabled : undefined,
                      isSelected ? styles.optionChipActive : undefined,
                    ]}
                    disabled={!selectedWholeNumber}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        !selectedWholeNumber ? styles.optionChipTextDisabled : undefined,
                        isSelected ? styles.optionChipTextActive : undefined,
                      ]}
                    >
                      {fraction}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable onPress={() => setActiveCircumferenceField(null)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        visible={isTitleEditorVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsTitleEditorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Race Title</Text>
            <TextInput
              value={editedRaceTitle}
              onChangeText={setEditedRaceTitle}
              placeholder="Race title"
              placeholderTextColor="#5E7B94"
              style={styles.input}
            />
            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setIsTitleEditorVisible(false)}
                style={[styles.modalCloseButton, styles.modalActionButton]}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={isSavingRaceTitle}
                onPress={() => void handleSaveRaceTitle()}
                style={[
                  styles.modalSaveButton,
                  styles.modalActionButton,
                  isSavingRaceTitle ? styles.modalSaveButtonDisabled : undefined,
                ]}
              >
                <Text style={styles.modalSaveButtonText}>
                  {isSavingRaceTitle ? "Saving..." : "Save Title"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      </KeyboardScreen>
      </View>
    );
  }

function Field({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  multiline,
  keyboardType,
  editable = true,
  halfWidth = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: "default" | "decimal-pad" | "number-pad" | "numbers-and-punctuation";
  editable?: boolean;
  halfWidth?: boolean;
}) {
  return (
    <View style={[styles.fieldBlock, halfWidth ? styles.fieldBlockHalf : undefined]}>
      <Pressable onPress={Keyboard.dismiss}>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#5E7B94"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        keyboardType={keyboardType}
        editable={editable}
        onBlur={onBlur}
        style={[
          styles.input,
          multiline ? styles.inputMultiline : undefined,
          !editable ? styles.inputDisabled : undefined,
        ]}
      />
    </View>
  );
}

function formatDuration(durationMs: number) {
  return `${(durationMs / 1000).toFixed(3)}s`;
}

function describeSkyCondition(cloudCover: number) {
  if (cloudCover >= 85) {
    return "Overcast";
  }

  if (cloudCover >= 55) {
    return "Cloudy";
  }

  if (cloudCover >= 25) {
    return "Partly Cloudy";
  }

  return "Sunny";
}

function describePrecipitation(precipitation: number) {
  if (precipitation <= 0) {
    return "Dry";
  }

  if (precipitation < 0.03) {
    return `Misting (${precipitation.toFixed(2)} in)`;
  }

  return `Rain (${precipitation.toFixed(2)} in)`;
}

function describeWindCondition(windSpeed: number, windGust: number) {
  const roundedSpeed = Math.round(windSpeed);
  const roundedGust = Math.round(windGust);

  if (roundedSpeed <= 4) {
    return `Calm (${roundedSpeed} mph)`;
  }

  if (roundedSpeed <= 11) {
    return `Light breeze (${roundedSpeed} mph)`;
  }

  if (roundedSpeed <= 20) {
    return roundedGust > roundedSpeed + 4
      ? `Breezy (${roundedSpeed} mph, gusts ${roundedGust})`
      : `Breezy (${roundedSpeed} mph)`;
  }

  return roundedGust > roundedSpeed + 4
    ? `Windy (${roundedSpeed} mph, gusts ${roundedGust})`
    : `Windy (${roundedSpeed} mph)`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  fixedTabsHeader: {
    backgroundColor: colors.bg,
    elevation: 12,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
  },
  headerContent: {
    paddingHorizontal: spacing(2),
    paddingTop: spacing(2),
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    padding: spacing(2),
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing(2),
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing(1),
    justifyContent: "space-between",
  },
  h1: {
    color: colors.text,
    flex: 1,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: spacing(1),
  },
  titleActionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing(0.75),
    marginBottom: spacing(1),
  },
  titleEditButton: {
    alignItems: "center",
    backgroundColor: "#17314C",
    borderColor: "#315B7D",
    borderRadius: 999,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  titleEditPencil: {
    backgroundColor: "#8ED4FF",
    borderRadius: 999,
    height: 3,
    transform: [{ rotate: "-45deg" }],
    width: 15,
  },
  titleEditPencilTip: {
    borderBottomColor: "transparent",
    borderBottomWidth: 3,
    borderLeftColor: "#F3FAFF",
    borderLeftWidth: 5,
    borderTopColor: "transparent",
    borderTopWidth: 3,
    height: 0,
    left: -4,
    position: "absolute",
    top: -1.5,
    width: 0,
  },
  subhead: {
    color: colors.subtext,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing(1),
  },
  stickyStageTabsWrap: {
    backgroundColor: colors.bg,
    elevation: 12,
    paddingBottom: spacing(0.25),
    position: "relative",
    zIndex: 12,
  },
  stickySectionTabsWrap: {
    backgroundColor: colors.bg,
    elevation: 11,
    paddingBottom: spacing(0.15),
    position: "relative",
    zIndex: 11,
  },
  infoBadge: {
    alignItems: "center",
    backgroundColor: "#F3FAFF",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  infoBadgeText: {
    color: "#0E223B",
    fontSize: 16,
    fontWeight: "800",
  },
  readOnlyBanner: {
    backgroundColor: "#203041",
    borderColor: "#5A738C",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing(2),
    padding: spacing(1.25),
  },
  readOnlyBannerText: {
    color: "#EAF7FF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  stageLockBanner: {
    backgroundColor: "#16283A",
    borderColor: "#315B7D",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing(2),
    padding: spacing(1.25),
  },
  stageLockBannerText: {
    color: "#CBE7FA",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
  },
  weatherAutofillRow: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: spacing(1),
    marginBottom: spacing(1),
  },
  weatherControlHalf: {
    flex: 1,
  },
  weatherSectionHelper: {
    color: "#87AFCB",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing(1),
    textAlign: "center",
  },
  weatherZipInput: {
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 16,
    borderWidth: 1,
    color: "#EAF7FF",
    fontSize: 17,
    height: 52,
    lineHeight: 17,
    paddingHorizontal: 14,
    paddingVertical: 0,
    textAlign: "center",
  },
  weatherZipInputLocked: {
    backgroundColor: "#091522",
    borderColor: "#163046",
    color: "#6E8BA3",
  },
  weatherZipPlaceholderSized: {
    fontSize: 15,
  },
  weatherAutofillButton: {
    alignItems: "center",
    backgroundColor: "#1780D4",
    borderRadius: 16,
    flex: 1,
    height: 52,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 0,
  },
  weatherAutofillButtonDisabled: {
    opacity: 0.7,
  },
  weatherAutofillButtonText: {
    color: "#F3FAFF",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 14,
    maxWidth: 92,
    textAlign: "center",
  },
  weatherAutofillStatus: {
    color: "#8ED4FF",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: spacing(1.25),
  },
  topRaceMetaRow: {
    flexDirection: "row",
    gap: spacing(1),
    marginBottom: spacing(2),
  },
  rainoutButton: {
    alignItems: "center",
    backgroundColor: "#8A1F1F",
    borderColor: "#D9534F",
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: spacing(2),
    paddingVertical: 12,
  },
  rainoutButtonText: {
    color: "#FFF4F4",
    fontSize: 15,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  topRaceMetaCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    padding: spacing(1.25),
  },
  topRaceMetaInline: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing(1),
  },
  topRaceMetaLabel: {
    color: "#8ED4FF",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  topRaceMetaLabelInline: {
    color: "#8ED4FF",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  topRaceMetaValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  topRaceMetaInput: {
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 12,
    borderWidth: 1,
    color: "#EAF7FF",
    flexShrink: 0,
    fontSize: 16,
    fontWeight: "800",
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: "center",
    width: 88,
  },
  inlineTooltipWrap: {
    alignItems: "flex-end",
    marginBottom: spacing(1.5),
    marginTop: -spacing(1),
    paddingRight: spacing(2.5),
  },
  inlineTooltipPointer: {
    borderLeftColor: "transparent",
    borderLeftWidth: 10,
    borderRightColor: "transparent",
    borderRightWidth: 10,
    borderTopColor: "transparent",
    borderTopWidth: 0,
    borderBottomColor: "#1780D4",
    borderBottomWidth: 12,
    marginRight: 24,
  },
  inlineTooltipCard: {
    backgroundColor: "#1780D4",
    borderColor: "#8ED4FF",
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 270,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1),
  },
  inlineTooltipTitle: {
    color: "#F3FAFF",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  tabCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    marginHorizontal: -4,
    padding: spacing(1.5),
    marginBottom: spacing(0.5),
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing(0.75),
  },
  stageTab: {
    alignItems: "center",
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  stageTabActive: {
    backgroundColor: "#1780D4",
    borderColor: "#8ED4FF",
  },
  stageTabText: {
    color: "#9FC6E4",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 14,
    textAlign: "center",
    textTransform: "uppercase",
  },
  stageTabTextStackedWrap: {
    textAlign: "center",
  },
  stageTabTextStackedTop: {
    fontSize: 12,
    lineHeight: 14,
  },
  stageTabTextStackedBottom: {
    fontSize: 9,
    lineHeight: 10,
  },
  stageTabTextHeatBottom: {
    fontSize: 12,
    lineHeight: 14,
  },
  stageTabTextActive: {
    color: "#F3FAFF",
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing(2),
    marginBottom: spacing(2),
  },
  sectionTabsCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    marginBottom: spacing(0.5),
    padding: spacing(1.25),
  },
  sectionTabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(0.75),
    justifyContent: "space-between",
  },
  sectionTab: {
    alignItems: "center",
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: "48%",
    minHeight: 46,
    justifyContent: "center",
    maxWidth: "48%",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sectionTabActive: {
    backgroundColor: "#1780D4",
    borderColor: "#8ED4FF",
  },
  sectionTabText: {
    color: "#9FC6E4",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    textTransform: "uppercase",
  },
  sectionTabTextActive: {
    color: "#F3FAFF",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  sectionArrow: {
    color: "#8ED4FF",
    fontSize: 18,
    fontWeight: "800",
  },
  setupGroupTitle: {
    color: "#8ED4FF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  setupSubSectionTitle: {
    color: "#8ED4FF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: spacing(1),
    marginTop: spacing(0.75),
    textAlign: "center",
    textTransform: "uppercase",
  },
  tempCornerCard: {
    backgroundColor: "#102947",
    borderColor: "#21486A",
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing(1.1),
  },
  tempCornerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: spacing(0.5),
    textAlign: "center",
  },
  tempAverageRow: {
    alignItems: "center",
    borderTopColor: "#21486A",
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing(0.25),
    paddingTop: spacing(0.75),
  },
  tempAverageLabel: {
    color: "#8ED4FF",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: spacing(0.25),
    textTransform: "uppercase",
  },
  tempAverageValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  setupTabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(0.75),
    justifyContent: "space-between",
    marginBottom: spacing(1.5),
    marginTop: spacing(1.25),
  },
  setupTab: {
    alignItems: "center",
    backgroundColor: "#102947",
    borderColor: "#21486A",
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: "48%",
    justifyContent: "center",
    minHeight: 44,
    maxWidth: "48%",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  setupTabActive: {
    backgroundColor: "#1780D4",
    borderColor: "#8ED4FF",
  },
  setupTabText: {
    color: "#8ED4FF",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  setupTabTextActive: {
    color: "#F3FAFF",
  },
  setupSubHeader: {
    alignItems: "center",
    backgroundColor: "#102947",
    borderColor: "#21486A",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing(1),
    marginTop: spacing(0.5),
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  setupSubArrow: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(1.5),
  },
  fieldBlock: {
    marginBottom: spacing(1.5),
  },
  fieldBlockHalf: {
    width: "47%",
  },
  centeredFieldWrap: {
    alignSelf: "center",
    width: "72%",
  },
  adjustmentSubTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: spacing(1),
    marginTop: spacing(0.5),
    textAlign: "center",
  },
  estimateCard: {
    backgroundColor: "#102947",
    borderColor: "#21486A",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing(1.5),
    padding: spacing(1.5),
  },
  estimateTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: spacing(1),
    textAlign: "center",
  },
  effectNotes: {
    marginTop: spacing(0.5),
  },
  effectNoteText: {
    color: "#CBE7FA",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing(0.5),
    textAlign: "center",
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: spacing(0.75),
    textAlign: "center",
  },
  input: {
    backgroundColor: "#0E223B",
    borderWidth: 1,
    borderColor: "#21486A",
    borderRadius: 16,
    color: "#EAF7FF",
    fontSize: 17,
    paddingHorizontal: 14,
    paddingVertical: 14,
    textAlign: "center",
  },
  inputMultiline: {
    minHeight: 92,
  },
  inputValue: {
    color: "#EAF7FF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  inputPlaceholder: {
    color: "#5E7B94",
    fontSize: 17,
    textAlign: "center",
  },
  circumferenceButton: {
    justifyContent: "center",
  },
  inputDisabled: {
    backgroundColor: "#091522",
    borderColor: "#163046",
    color: "#6E8BA3",
  },
  readOnlyHelper: {
    color: "#7FA6C0",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing(1.5),
    marginTop: spacing(-0.5),
  },
  staggerRow: {
    flexDirection: "row",
    gap: spacing(1.25),
    marginBottom: spacing(1.5),
  },
  staggerCard: {
    alignItems: "center",
    backgroundColor: "#102947",
    borderColor: "#21486A",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: spacing(1),
    paddingVertical: spacing(1.25),
  },
  staggerLabel: {
    color: "#8ED4FF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    lineHeight: 13,
    marginBottom: spacing(0.4),
    textAlign: "center",
    textTransform: "uppercase",
  },
  gearRatioLabel: {
    color: "#8ED4FF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: spacing(0.4),
    textTransform: "uppercase",
  },
  staggerValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: spacing(0.25),
  },
  gearRatioValue: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    marginBottom: spacing(0.25),
  },
  staggerHint: {
    color: colors.subtext,
    fontSize: 12,
    textAlign: "center",
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    flex: 1,
    justifyContent: "center",
    padding: spacing(2),
  },
  modalCard: {
    backgroundColor: "#102947",
    borderColor: "#21486A",
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing(2),
    width: "100%",
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: spacing(0.5),
    textAlign: "center",
  },
  modalHelp: {
    color: "#87AFCB",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing(1.5),
    textAlign: "center",
  },
  modalSectionLabel: {
    color: "#8ED4FF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: spacing(0.75),
    textAlign: "center",
    textTransform: "uppercase",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(0.75),
    justifyContent: "center",
    marginBottom: spacing(1.5),
  },
  optionChip: {
    alignItems: "center",
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionChipActive: {
    backgroundColor: "#1780D4",
    borderColor: "#8ED4FF",
  },
  optionChipDisabled: {
    opacity: 0.45,
  },
  optionChipText: {
    color: "#8ED4FF",
    fontSize: 16,
    fontWeight: "800",
  },
  optionChipTextActive: {
    color: "#F3FAFF",
  },
  optionChipTextDisabled: {
    color: "#6C8CA5",
  },
  modalCloseButton: {
    alignItems: "center",
    borderColor: "#21486A",
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 12,
  },
  modalActionRow: {
    flexDirection: "row",
    gap: spacing(1),
    marginTop: spacing(1.25),
  },
  modalActionButton: {
    flex: 1,
  },
  modalSaveButton: {
    alignItems: "center",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    paddingVertical: 12,
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveButtonText: {
    color: "#F3FAFF",
    fontSize: 14,
    fontWeight: "800",
  },
  modalCloseButtonText: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "800",
  },
  stopwatchTopRow: {
    flexDirection: "row",
    gap: spacing(1),
    marginBottom: spacing(1.25),
  },
  stopwatchStatCard: {
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    padding: spacing(1.25),
  },
  stopwatchStatLabel: {
    color: "#8ED4FF",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  stopwatchStatValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  stopwatchStatInput: {
    backgroundColor: "#091522",
    borderColor: "#21486A",
    borderRadius: 12,
    borderWidth: 1,
    color: "#EAF7FF",
    fontSize: 16,
    fontWeight: "800",
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: "center",
  },
  stopwatchDisplay: {
    alignItems: "center",
    backgroundColor: "#091522",
    borderColor: "#21486A",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing(1.25),
    paddingVertical: spacing(1.5),
  },
  stopwatchRaceTitle: {
    color: "#8ED4FF",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  stopwatchTime: {
    color: "#F3FAFF",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 1,
  },
  stopwatchSubhead: {
    color: "#8ED4FF",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  stopwatchActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(1),
    marginBottom: spacing(1),
  },
  stopwatchButton: {
    alignItems: "center",
    borderRadius: 14,
    minWidth: "47%",
    paddingVertical: 12,
  },
  startButton: {
    backgroundColor: "#1D7D39",
  },
  lapButton: {
    backgroundColor: "#1780D4",
  },
  cautionButton: {
    backgroundColor: "#D6A400",
  },
  cautionButtonText: {
    color: "#111111",
    fontSize: 14,
    fontWeight: "900",
  },
  stopButton: {
    backgroundColor: "#A62626",
  },
  stopwatchButtonDisabled: {
    opacity: 0.45,
  },
  stopwatchButtonText: {
    color: "#F3FAFF",
    fontSize: 14,
    fontWeight: "800",
  },
  checkeredButton: {
    alignItems: "center",
    backgroundColor: "#203041",
    borderColor: "#5A738C",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: spacing(1.5),
    paddingVertical: 12,
  },
  checkeredButtonText: {
    color: "#F3FAFF",
    fontSize: 14,
    fontWeight: "800",
  },
  lapRow: {
    alignItems: "center",
    borderTopColor: "#21486A",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing(1),
  },
  lapRowCopy: {
    flex: 1,
    paddingRight: spacing(1),
  },
  lapRowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  lapRowTime: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "700",
  },
  cautionChip: {
    alignItems: "center",
    backgroundColor: "#5B4A10",
    borderColor: "#A68B2C",
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 78,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cautionChipActive: {
    backgroundColor: "#D6A400",
    borderColor: "#FFD44D",
  },
  cautionChipText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  emptyLapText: {
    color: colors.subtext,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  checklistSection: {
    marginBottom: spacing(1.5),
  },
  checklistTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: spacing(1),
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing(1),
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#5AB3FF",
    marginRight: spacing(1),
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: "#1780D4",
  },
  checklistLabel: {
    color: colors.subtext,
    fontSize: 15,
    flex: 1,
  },
  checklistCheckedBy: {
    color: "#8ED4FF",
    fontStyle: "italic",
    fontWeight: "700",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    paddingVertical: 15,
    marginBottom: spacing(1.5),
  },
  primaryButtonText: {
    color: "#F3FAFF",
    fontSize: 17,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "#21486A",
    borderRadius: 999,
    paddingVertical: 15,
    marginBottom: spacing(3),
  },
  secondaryButtonText: {
    color: "#8ED4FF",
    fontSize: 17,
    fontWeight: "800",
  },
});
