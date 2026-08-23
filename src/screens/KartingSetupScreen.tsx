import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, Keyboard, Modal, Pressable, StyleSheet, Text, TouchableWithoutFeedback, View } from "react-native";
import AppPressable from "../components/AppPressable";
import TextInput from "../components/AppTextInput";
import KeyboardScreen from "../components/KeyboardScreen";
import { isVisiblePreferenceSelected } from "../data/teamPreferences";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { colors, spacing } from "../theme";
import { calculateGearRatio, formatGearRatio } from "../utils/gears";
import {
  calculateStaggerValue,
  formatMeasurementValue,
  type TireMeasurementDisplayMode,
} from "../utils/tireMeasurements";
import {
  emptyKartingBaselineSetup,
  type KartingBaselineSetup,
  type KartingChassisSetup,
  type KartingGearSetup,
  type KartingNotesSetup,
  type KartingTireSetup,
  loadKartingBaselineSetup,
  saveKartingBaselineSetup,
} from "../utils/kartingSetupStorage";
import { normalizeFractionMeasurementInput, sanitizeFractionMeasurementInput } from "../utils/measurementInputs";

const circumferenceWholeNumberOptions = Array.from({ length: 9 }, (_, index) => `${30 + index}`);
const circumferenceFractionOptions = ["0", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8"] as const;

type KartingSection = "Kart Chassis" | "Tires" | "Gears" | "Track & Driver Notes";

function sanitizeNumberInput(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length ? `${whole}.${rest.join("")}` : cleaned;
}

function sanitizeWholeNumberInput(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function SectionIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <Pressable onPress={Keyboard.dismiss}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </Pressable>
      <Pressable onPress={Keyboard.dismiss}>
        <Text style={styles.sectionDescription}>{description}</Text>
      </Pressable>
    </>
  );
}

function SetupField({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType = "default",
  multiline = false,
  onBlur,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "decimal-pad" | "number-pad";
  multiline?: boolean;
  onBlur?: () => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Pressable onPress={Keyboard.dismiss}>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      <TextInput
        style={[styles.input, multiline ? styles.textarea : undefined]}
        placeholder={placeholder}
        placeholderTextColor="#4F7390"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        onBlur={onBlur}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

function TireCornerField({
  label,
  circumference,
  pressure,
  wheelOffset,
  showCircumference,
  showPressure,
  showWheelOffset,
  onPressCircumference,
  onChangePressure,
  onChangeWheelOffset,
  onBlurWheelOffset,
}: {
  label: string;
  circumference: string;
  pressure: string;
  wheelOffset: string;
  showCircumference: boolean;
  showPressure: boolean;
  showWheelOffset: boolean;
  onPressCircumference: () => void;
  onChangePressure: (value: string) => void;
  onChangeWheelOffset: (value: string) => void;
  onBlurWheelOffset: () => void;
}) {
  return (
    <View style={styles.cornerCard}>
      <Pressable onPress={Keyboard.dismiss}>
        <Text style={styles.cornerTitle}>{label}</Text>
      </Pressable>

      {showCircumference ? (
        <>
          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.cornerLabel}>Circumference</Text>
          </Pressable>
          <Pressable onPress={onPressCircumference} style={[styles.input, styles.circumferenceButton]}>
            <Text style={circumference ? styles.inputValue : styles.inputPlaceholder}>
              {circumference || "Select"}
            </Text>
          </Pressable>
        </>
      ) : null}

      {showPressure ? (
        <>
          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.cornerLabel}>Pressure</Text>
          </Pressable>
          <TextInput
            style={[styles.input, styles.inputCompact]}
            placeholder=""
            placeholderTextColor="#4F7390"
            value={pressure}
            onChangeText={(value) => onChangePressure(sanitizeNumberInput(value))}
            keyboardType="decimal-pad"
          />
        </>
      ) : null}

      {showWheelOffset ? (
        <>
          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.cornerLabel}>Wheel Offset</Text>
          </Pressable>
          <TextInput
            style={[styles.input, styles.inputCompact]}
            placeholder=""
            placeholderTextColor="#4F7390"
            value={wheelOffset}
            onChangeText={(value) => onChangeWheelOffset(sanitizeFractionMeasurementInput(value))}
            onBlur={onBlurWheelOffset}
            keyboardType="number-pad"
          />
        </>
      ) : null}
    </View>
  );
}

export default function KartingSetupScreen({ route }: any) {
  const insets = useSafeAreaInsets();
  const section = (route?.params?.section as KartingSection | undefined) ?? "Kart Chassis";
  const userName = useAppStore((state) => state.userName);
  const carClass = useAppStore((state) => state.carClass);
  const setupVisibilityPreferences = useAppStore((state) => state.setupVisibilityPreferences);
  const [setup, setSetup] = useState<KartingBaselineSetup>(emptyKartingBaselineSetup);
  const [activeCircumferenceField, setActiveCircumferenceField] = useState<keyof KartingTireSetup | null>(null);
  const [selectedWholeNumber, setSelectedWholeNumber] = useState("");
  const [selectedFraction, setSelectedFraction] = useState<(typeof circumferenceFractionOptions)[number]>("0");
  const displayMode: TireMeasurementDisplayMode = "fraction";

  useEffect(() => {
    let isMounted = true;

    const loadSetup = async () => {
      const loadedSetup = await loadKartingBaselineSetup();
      if (isMounted) {
        setSetup(loadedSetup);
      }
    };

    void loadSetup();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeCircumferenceField) {
      return;
    }

    const currentValue = setup.tires[activeCircumferenceField];
    const match = currentValue.trim().match(/^(\d+)(?:\s+((?:1|3|5|7)\/8|1\/4|1\/2|3\/4))?$/);

    if (!match) {
      setSelectedWholeNumber("");
      setSelectedFraction("0");
      return;
    }

    setSelectedWholeNumber(match[1]);
    setSelectedFraction((match[2] as (typeof circumferenceFractionOptions)[number] | undefined) ?? "0");
  }, [activeCircumferenceField, setup.tires]);

  const frontStaggerValue = useMemo(
    () => calculateStaggerValue(setup.tires.lfCircumference, setup.tires.rfCircumference),
    [setup.tires.lfCircumference, setup.tires.rfCircumference],
  );
  const rearStaggerValue = useMemo(
    () => calculateStaggerValue(setup.tires.lrCircumference, setup.tires.rrCircumference),
    [setup.tires.lrCircumference, setup.tires.rrCircumference],
  );
  const frontStagger = frontStaggerValue == null ? "-" : formatMeasurementValue(frontStaggerValue, displayMode);
  const rearStagger = rearStaggerValue == null ? "-" : formatMeasurementValue(rearStaggerValue, displayMode);

  const previewRatio = useMemo(
    () => calculateGearRatio(setup.gears.rearAxleSprocketTeeth, setup.gears.clutchSprocketTeeth),
    [setup.gears.clutchSprocketTeeth, setup.gears.rearAxleSprocketTeeth],
  );

  const handleChassisChange = (field: keyof KartingChassisSetup, value: string, sanitize = false) => {
    setSetup((current) => ({
      ...current,
      chassis: {
        ...current.chassis,
        [field]: sanitize ? sanitizeNumberInput(value) : value,
      },
    }));
  };

  const handleTireChange = (field: keyof KartingTireSetup, value: string) => {
    setSetup((current) => ({
      ...current,
      tires: {
        ...current.tires,
        [field]: value,
      },
    }));
  };

  const handleGearChange = (field: keyof KartingGearSetup, value: string, sanitize = false) => {
    setSetup((current) => ({
      ...current,
      gears: {
        ...current.gears,
        [field]: sanitize ? sanitizeWholeNumberInput(value) : value,
      },
    }));
  };

  const handleNotesChange = (field: keyof KartingNotesSetup, value: string) => {
    setSetup((current) => ({
      ...current,
      notes: {
        ...current.notes,
        [field]: value,
      },
    }));
  };

  const handleWheelOffsetBlur = (field: keyof KartingTireSetup) => {
    setSetup((current) => ({
      ...current,
      tires: {
        ...current.tires,
        [field]: normalizeFractionMeasurementInput(current.tires[field]),
      },
    }));
  };

  const visibleKartChassisFields = {
    frontWidth: isVisiblePreferenceSelected(setupVisibilityPreferences, "kartChassis", "frontWidth"),
    rearWidth: isVisiblePreferenceSelected(setupVisibilityPreferences, "kartChassis", "rearWidth"),
    seatPosition: isVisiblePreferenceSelected(setupVisibilityPreferences, "kartChassis", "seatPosition"),
    torsionBars: isVisiblePreferenceSelected(setupVisibilityPreferences, "kartChassis", "torsionBars"),
  };
  const visibleKartTireCorners = [
    { id: "lf", label: "LF", circumferenceKey: "lfCircumference", pressureKey: "lfPressure", wheelOffsetKey: "lfWheelOffset" },
    { id: "rf", label: "RF", circumferenceKey: "rfCircumference", pressureKey: "rfPressure", wheelOffsetKey: "rfWheelOffset" },
    { id: "lr", label: "LR", circumferenceKey: "lrCircumference", pressureKey: "lrPressure", wheelOffsetKey: "lrWheelOffset" },
    { id: "rr", label: "RR", circumferenceKey: "rrCircumference", pressureKey: "rrPressure", wheelOffsetKey: "rrWheelOffset" },
  ].filter((corner) =>
    isVisiblePreferenceSelected(setupVisibilityPreferences, "kartTires", corner.circumferenceKey) ||
    isVisiblePreferenceSelected(setupVisibilityPreferences, "kartTires", corner.pressureKey) ||
    isVisiblePreferenceSelected(setupVisibilityPreferences, "kartTires", corner.wheelOffsetKey),
  );
  const showKartTireCompound = isVisiblePreferenceSelected(
    setupVisibilityPreferences,
    "kartTires",
    "tireCompound",
  );
  const showKartFrontStagger =
    isVisiblePreferenceSelected(setupVisibilityPreferences, "kartTires", "lfCircumference") &&
    isVisiblePreferenceSelected(setupVisibilityPreferences, "kartTires", "rfCircumference");
  const showKartRearStagger =
    isVisiblePreferenceSelected(setupVisibilityPreferences, "kartTires", "lrCircumference") &&
    isVisiblePreferenceSelected(setupVisibilityPreferences, "kartTires", "rrCircumference");
  const visibleKartGearFields = {
    rearAxleSprocketTeeth: isVisiblePreferenceSelected(
      setupVisibilityPreferences,
      "kartGears",
      "rearAxleSprocketTeeth",
    ),
    clutchSprocketTeeth: isVisiblePreferenceSelected(
      setupVisibilityPreferences,
      "kartGears",
      "clutchSprocketTeeth",
    ),
    notes: isVisiblePreferenceSelected(setupVisibilityPreferences, "kartGears", "notes"),
  };
  const visibleKartNoteFields = {
    trackNotes: isVisiblePreferenceSelected(setupVisibilityPreferences, "kartNotes", "trackNotes"),
    rubberNotes: isVisiblePreferenceSelected(setupVisibilityPreferences, "kartNotes", "rubberNotes"),
    driverComments: isVisiblePreferenceSelected(
      setupVisibilityPreferences,
      "kartNotes",
      "driverComments",
    ),
    lapTimeNotes: isVisiblePreferenceSelected(setupVisibilityPreferences, "kartNotes", "lapTimeNotes"),
  };

  const handleSave = async (successMessage: string) => {
    try {
      await saveKartingBaselineSetup(setup);
      Alert.alert("Saved", successMessage);
    } catch {
      Alert.alert("Save failed", "Unable to save the karting setup right now.");
    }
  };

  const handleSelectWholeNumber = (wholeNumber: string) => {
    setSelectedWholeNumber(wholeNumber);

    if (!activeCircumferenceField) {
      return;
    }

    if (selectedFraction === "0") {
      handleTireChange(activeCircumferenceField, wholeNumber);
    }
  };

  const handleSelectFraction = (fraction: (typeof circumferenceFractionOptions)[number]) => {
    if (!activeCircumferenceField || !selectedWholeNumber) {
      return;
    }

    const nextValue = fraction === "0" ? selectedWholeNumber : `${selectedWholeNumber} ${fraction}`;
    handleTireChange(activeCircumferenceField, nextValue);
    setSelectedFraction(fraction);
    setActiveCircumferenceField(null);
  };

  const screenTitle = carClass || "Karting";

  return (
    <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
      <KeyboardScreen style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="always">
        <Image
          source={
            section === "Kart Chassis"
              ? require("../../assets/icons/chassis.png")
              : section === "Tires"
                ? require("../../assets/icons/tires.png")
                : section === "Gears"
                  ? require("../../assets/icons/gears.png")
                  : require("../../assets/icons/setups.png")
          }
          style={styles.bannerImage}
          resizeMode="contain"
        />

        <Pressable onPress={Keyboard.dismiss}>
          <Text style={styles.eyebrow}>Karting Baseline</Text>
        </Pressable>
        <Pressable onPress={Keyboard.dismiss}>
          <Text style={styles.title}>{screenTitle}</Text>
        </Pressable>
        <Pressable onPress={Keyboard.dismiss}>
          <Text style={styles.subtitle}>
            {userName
              ? `Welcome, ${userName}! Save the team's ${section.toLowerCase()} baseline here.`
              : `Save the team's ${section.toLowerCase()} baseline here.`}
          </Text>
        </Pressable>

        {section === "Kart Chassis" ? (
          <View style={styles.card}>
            <SectionIntro
              title="Kart Chassis"
              description="Only kart chassis baseline settings live on this page."
            />
            {visibleKartChassisFields.frontWidth ? (
            <SetupField
              label="Front Width"
              value={setup.chassis.frontWidth}
              placeholder="46.5"
              keyboardType="decimal-pad"
              onChangeText={(value) => handleChassisChange("frontWidth", value, true)}
            />
            ) : null}
            {visibleKartChassisFields.rearWidth ? (
            <SetupField
              label="Rear Width"
              value={setup.chassis.rearWidth}
              placeholder="54.75"
              keyboardType="decimal-pad"
              onChangeText={(value) => handleChassisChange("rearWidth", value, true)}
            />
            ) : null}
            {visibleKartChassisFields.seatPosition ? (
            <SetupField
              label="Seat Position"
              value={setup.chassis.seatPosition}
              placeholder="1/4 in right, neutral front"
              onChangeText={(value) => handleChassisChange("seatPosition", value)}
            />
            ) : null}
            {visibleKartChassisFields.torsionBars ? (
            <SetupField
              label="Torsion Bars"
              value={setup.chassis.torsionBars}
              placeholder="Center out, left in"
              onChangeText={(value) => handleChassisChange("torsionBars", value)}
            />
            ) : null}

            <AppPressable
              onPress={() => {
                Keyboard.dismiss();
                void handleSave("Kart chassis settings saved.");
              }}
              style={[styles.button, { marginBottom: Math.max(insets.bottom, 18) + 18 }]}
            >
              <Text style={styles.buttonText}>Save Kart Chassis</Text>
            </AppPressable>
          </View>
        ) : null}

        {section === "Tires" ? (
          <View style={styles.card}>
            <SectionIntro
              title="Tires"
              description="Circumference, pressure, stagger, wheel offset, and compound stay together here."
            />

            <View style={styles.cornerGrid}>
              {visibleKartTireCorners.map((corner) => (
                <TireCornerField
                  key={corner.id}
                  label={corner.label}
                  circumference={setup.tires[corner.circumferenceKey as keyof KartingTireSetup]}
                  pressure={setup.tires[corner.pressureKey as keyof KartingTireSetup]}
                  wheelOffset={setup.tires[corner.wheelOffsetKey as keyof KartingTireSetup]}
                  showCircumference={isVisiblePreferenceSelected(
                    setupVisibilityPreferences,
                    "kartTires",
                    corner.circumferenceKey,
                  )}
                  showPressure={isVisiblePreferenceSelected(
                    setupVisibilityPreferences,
                    "kartTires",
                    corner.pressureKey,
                  )}
                  showWheelOffset={isVisiblePreferenceSelected(
                    setupVisibilityPreferences,
                    "kartTires",
                    corner.wheelOffsetKey,
                  )}
                  onPressCircumference={() =>
                    setActiveCircumferenceField(corner.circumferenceKey as keyof KartingTireSetup)
                  }
                  onChangePressure={(value) =>
                    handleTireChange(corner.pressureKey as keyof KartingTireSetup, value)
                  }
                  onChangeWheelOffset={(value) =>
                    handleTireChange(corner.wheelOffsetKey as keyof KartingTireSetup, value)
                  }
                  onBlurWheelOffset={() =>
                    handleWheelOffsetBlur(corner.wheelOffsetKey as keyof KartingTireSetup)
                  }
                />
              ))}
            </View>

            {showKartFrontStagger || showKartRearStagger ? (
              <Pressable onPress={Keyboard.dismiss}>
                <View style={styles.staggerRow}>
                  {showKartFrontStagger ? (
                    <View style={styles.staggerCard}>
                      <Text style={styles.staggerLabel}>Front Stagger</Text>
                      <Text style={styles.staggerValue}>{frontStagger}</Text>
                      <Text style={styles.staggerHint}>RF minus LF</Text>
                    </View>
                  ) : null}
                  {showKartRearStagger ? (
                    <View style={styles.staggerCard}>
                      <Text style={styles.staggerLabel}>Rear Stagger</Text>
                      <Text style={styles.staggerValue}>{rearStagger}</Text>
                      <Text style={styles.staggerHint}>RR minus LR</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ) : null}

            {showKartTireCompound ? (
            <SetupField
              label="Tire Compound"
              value={setup.tires.tireCompound}
              placeholder="MG Red"
              onChangeText={(value) => handleTireChange("tireCompound", value)}
            />
            ) : null}

            <AppPressable
              onPress={() => {
                Keyboard.dismiss();
                void handleSave("Kart tire settings saved.");
              }}
              style={[styles.button, { marginBottom: Math.max(insets.bottom, 18) + 18 }]}
            >
              <Text style={styles.buttonText}>Save Tires</Text>
            </AppPressable>
          </View>
        ) : null}

        {section === "Gears" ? (
          <View style={styles.card}>
            <SectionIntro
              title="Gears"
              description="Save the kart's sprocket tooth counts and use the ratio calculator here."
            />
            {visibleKartGearFields.rearAxleSprocketTeeth ? (
            <SetupField
              label="Rear Axle Sprocket Teeth"
              value={setup.gears.rearAxleSprocketTeeth}
              placeholder="64"
              keyboardType="number-pad"
              onChangeText={(value) => handleGearChange("rearAxleSprocketTeeth", value, true)}
            />
            ) : null}
            {visibleKartGearFields.clutchSprocketTeeth ? (
            <SetupField
              label="Clutch Sprocket Teeth"
              value={setup.gears.clutchSprocketTeeth}
              placeholder="10"
              keyboardType="number-pad"
              onChangeText={(value) => handleGearChange("clutchSprocketTeeth", value, true)}
            />
            ) : null}

            {visibleKartGearFields.rearAxleSprocketTeeth &&
            visibleKartGearFields.clutchSprocketTeeth ? (
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.previewText}>{`Gear Ratio: ${formatGearRatio(previewRatio)}`}</Text>
            </Pressable>
            ) : null}
            {visibleKartGearFields.rearAxleSprocketTeeth &&
            visibleKartGearFields.clutchSprocketTeeth ? (
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.previewHint}>
                Rear axle sprocket teeth divided by clutch sprocket teeth
              </Text>
            </Pressable>
            ) : null}

            {visibleKartGearFields.notes ? (
            <SetupField
              label="Gear Notes"
              value={setup.gears.notes}
              placeholder="Track size, chain, or engine notes"
              multiline
              onChangeText={(value) => handleGearChange("notes", value)}
            />
            ) : null}

            <AppPressable
              onPress={() => {
                Keyboard.dismiss();
                void handleSave("Kart gear settings saved.");
              }}
              style={[styles.button, { marginBottom: Math.max(insets.bottom, 18) + 18 }]}
            >
              <Text style={styles.buttonText}>Save Gears</Text>
            </AppPressable>
          </View>
        ) : null}

        {section === "Track & Driver Notes" ? (
          <View style={styles.card}>
            <SectionIntro
              title="Track & Driver Notes"
              description="Keep kart-specific grip, rubber, lap-time, and driver notes separate from the setup hardware pages."
            />
            {visibleKartNoteFields.trackNotes ? (
            <SetupField
              label="Track Notes"
              value={setup.notes.trackNotes}
              placeholder="Grip level, lane, moisture, or temperature"
              multiline
              onChangeText={(value) => handleNotesChange("trackNotes", value)}
            />
            ) : null}
            {visibleKartNoteFields.rubberNotes ? (
            <SetupField
              label="Rubber / Grip Notes"
              value={setup.notes.rubberNotes}
              placeholder="Rubber build-up, bite, or slick-off notes"
              multiline
              onChangeText={(value) => handleNotesChange("rubberNotes", value)}
            />
            ) : null}
            {visibleKartNoteFields.driverComments ? (
            <SetupField
              label="Driver Comments"
              value={setup.notes.driverComments}
              placeholder="Entry, center, exit, and balance feel"
              multiline
              onChangeText={(value) => handleNotesChange("driverComments", value)}
            />
            ) : null}
            {visibleKartNoteFields.lapTimeNotes ? (
            <SetupField
              label="Lap Time Notes"
              value={setup.notes.lapTimeNotes}
              placeholder="Fast lap, average pace, or timing notes"
              multiline
              onChangeText={(value) => handleNotesChange("lapTimeNotes", value)}
            />
            ) : null}

            <AppPressable
              onPress={() => {
                Keyboard.dismiss();
                void handleSave("Kart track and driver notes saved.");
              }}
              style={[styles.button, { marginBottom: Math.max(insets.bottom, 18) + 18 }]}
            >
              <Text style={styles.buttonText}>Save Notes</Text>
            </AppPressable>
          </View>
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
                Kart sizes start with smaller whole numbers, then finish with the fraction.
              </Text>

              <Text style={styles.modalSectionLabel}>Whole Number</Text>
              <View style={styles.optionGrid}>
                {circumferenceWholeNumberOptions.map((wholeNumber) => {
                  const isSelected = selectedWholeNumber === wholeNumber;
                  return (
                    <Pressable
                      key={wholeNumber}
                      onPress={() => handleSelectWholeNumber(wholeNumber)}
                      style={[styles.optionChip, styles.optionChipCompact, isSelected ? styles.optionChipActive : undefined]}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          styles.optionChipTextCompact,
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
      </KeyboardScreen>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  container: {
    backgroundColor: colors.bg,
    flexGrow: 1,
    paddingBottom: spacing(2),
  },
  bannerImage: {
    alignSelf: "center",
    height: 220,
    marginBottom: spacing(0.25),
    marginTop: spacing(4),
    width: 220,
  },
  eyebrow: {
    color: "#8ED4FF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: spacing(1),
    textAlign: "center",
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    marginTop: spacing(0.5),
    paddingHorizontal: spacing(2),
    textAlign: "center",
  },
  subtitle: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing(1),
    paddingHorizontal: spacing(2),
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: spacing(2),
    marginTop: spacing(2),
    padding: spacing(1.5),
  },
  sectionTitle: {
    color: "#8ED4FF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: spacing(0.5),
    textAlign: "center",
  },
  sectionDescription: {
    color: "#87AFCB",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing(1.5),
    textAlign: "center",
  },
  fieldBlock: {
    marginBottom: spacing(1.25),
  },
  label: {
    color: "#8ED4FF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: spacing(0.5),
    textAlign: "center",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 16,
    borderWidth: 1,
    color: "#EAF7FF",
    fontSize: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    textAlign: "center",
  },
  inputCompact: {
    marginBottom: 0,
  },
  inputValue: {
    color: "#EAF7FF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  inputPlaceholder: {
    color: "#4F7390",
    fontSize: 18,
    textAlign: "center",
  },
  textarea: {
    minHeight: 100,
    paddingTop: 14,
    textAlign: "left",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    marginTop: spacing(0.75),
    paddingVertical: 16,
  },
  buttonText: {
    color: "#F3FAFF",
    fontSize: 16,
    fontWeight: "800",
  },
  cornerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(1.25),
    marginBottom: spacing(1.5),
  },
  cornerCard: {
    backgroundColor: "#102947",
    borderColor: "#21486A",
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing(1.25),
    width: "48%",
  },
  cornerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: spacing(0.75),
    textAlign: "center",
  },
  cornerLabel: {
    color: "#8ED4FF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: spacing(0.3),
    textAlign: "center",
    textTransform: "uppercase",
  },
  circumferenceButton: {
    marginBottom: spacing(1),
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
    marginBottom: spacing(0.4),
    textTransform: "uppercase",
  },
  staggerValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: spacing(0.25),
  },
  staggerHint: {
    color: colors.subtext,
    fontSize: 12,
    textAlign: "center",
  },
  previewText: {
    color: "#5AB3FF",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: spacing(0.5),
    textAlign: "center",
  },
  previewHint: {
    color: colors.subtext,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing(1.25),
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
  optionChipCompact: {
    minWidth: 52,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
  optionChipTextCompact: {
    fontSize: 14,
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
  modalCloseButtonText: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "800",
  },
});
