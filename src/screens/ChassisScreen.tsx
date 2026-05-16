import React, { useEffect, useMemo, useState } from "react";
import { Alert, GestureResponderEvent, Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import TextInput from "../components/AppTextInput";
import KeyboardScreen from "../components/KeyboardScreen";
import {
  chassisBuilderBaselines,
  chassisBuilderOptions,
  type ChassisBuilderOption,
} from "../data/chassisBuilders";
import { colors, spacing } from "../theme";
import { ChassisSetup, useAppStore } from "../store/useAppStore";
import { calculateEstimatedScaleEffect } from "../utils/estimatedScaleEffect";
import {
  normalizeFractionMeasurementInput,
  sanitizeFractionMeasurementInput,
} from "../utils/measurementInputs";
import { calculateScalePercentages } from "../utils/scales";

type ChassisFieldKey = keyof ChassisSetup;
type ChassisDataFieldKey = Exclude<ChassisFieldKey, "chassisBuilder">;

type NumericField = {
  key: ChassisDataFieldKey;
  label: string;
  placeholder: string;
  reference: string;
};

const rideHeightFields: NumericField[] = [
  {
    key: "rideHeightLf",
    label: "LF Ride Height",
    placeholder: "5 3/4",
    reference: "Common dirt-oval baselines are often tracked in inches at each corner.",
  },
  {
    key: "rideHeightRf",
    label: "RF Ride Height",
    placeholder: "5 1/2",
    reference: "Track RF lower than LF only if that matches your chassis package baseline.",
  },
  {
    key: "rideHeightLr",
    label: "LR Ride Height",
    placeholder: "6 1/4",
    reference: "Rear ride heights are usually recorded by corner, not as one combined note.",
  },
  {
    key: "rideHeightRr",
    label: "RR Ride Height",
    placeholder: "6",
    reference: "Use decimals so your team can keep quarter-inch style adjustments organized.",
  },
];

const wingSprintFields: Array<{
  key: ChassisDataFieldKey;
  label: string;
  placeholder: string;
  reference: string;
}> = [
  {
    key: "topWingAngle",
    label: "Top Wing Angle",
    placeholder: "12",
    reference: "Record the wing angle setting your team actually runs so changes stay comparable race to race.",
  },
  {
    key: "sliderPosition",
    label: "Slider Position",
    placeholder: "4 in back",
    reference: "Use the same unit every time, such as inches back or hole position, so your notes stay usable.",
  },
  {
    key: "wickerBillSize",
    label: "Wicker Bill Size",
    placeholder: "2 in",
    reference: "Capture the wicker bill height or size that was installed on the top wing.",
  },
  {
    key: "noseWingAngle",
    label: "Nose Wing Angle",
    placeholder: "6",
    reference: "Log the nose wing angle with the same convention your team uses in the shop.",
  },
];

const percentFields: NumericField[] = [
  {
    key: "crossweightWedge",
    label: "Crossweight / Wedge %",
    placeholder: "52.5",
    reference: "Dirt starting points are often tracked in the low-to-mid 50% range, then adjusted to entry/exit balance.",
  },
  {
    key: "leftSidePercentage",
    label: "Left Side %",
    placeholder: "54.0",
    reference: "Many dirt teams track left-side percentage in the low-to-mid 50s as a baseline reference.",
  },
  {
    key: "rearPercentage",
    label: "Rear %",
    placeholder: "58.0",
    reference: "Rear percentage is commonly logged as a decimal percentage so changes are easy to compare run to run.",
  },
];

const scaleWeightFields: NumericField[] = [
  {
    key: "scaleLf",
    label: "LF Scale Weight",
    placeholder: "625",
    reference: "Enter the LF scale number from the pads.",
  },
  {
    key: "scaleRf",
    label: "RF Scale Weight",
    placeholder: "575",
    reference: "Enter the RF scale number from the pads.",
  },
  {
    key: "scaleLr",
    label: "LR Scale Weight",
    placeholder: "650",
    reference: "Enter the LR scale number from the pads.",
  },
  {
    key: "scaleRr",
    label: "RR Scale Weight",
    placeholder: "600",
    reference: "Enter the RR scale number from the pads.",
  },
];

const jackBoltFields: NumericField[] = [
  { key: "lfJackBoltTurns", label: "LF Jack Bolt Turns", placeholder: "0.0", reference: "Use positive for up / adding load, negative for down." },
  { key: "rfJackBoltTurns", label: "RF Jack Bolt Turns", placeholder: "0.0", reference: "Track turns from your last scaled baseline." },
  { key: "lrJackBoltTurns", label: "LR Jack Bolt Turns", placeholder: "0.0", reference: "LR turns often have the strongest wedge effect." },
  { key: "rrJackBoltTurns", label: "RR Jack Bolt Turns", placeholder: "0.0", reference: "Use negative if you backed the RR down." },
];

const springChangeFields: NumericField[] = [
  { key: "lfSpringChange", label: "LF Spring Change", placeholder: "0", reference: "Enter pounds changed from baseline, positive or negative." },
  { key: "rfSpringChange", label: "RF Spring Change", placeholder: "0", reference: "Positive = stiffer than baseline, negative = softer." },
  { key: "lrSpringChange", label: "LR Spring Change", placeholder: "0", reference: "Use pounds changed from the saved baseline spring." },
  { key: "rrSpringChange", label: "RR Spring Change", placeholder: "0", reference: "Track spring split changes here for estimates." },
];

const shockChangeFields: NumericField[] = [
  { key: "lfShockChange", label: "LF Shock Change", placeholder: "0", reference: "Use clicks or your team's shock-step unit, positive or negative." },
  { key: "rfShockChange", label: "RF Shock Change", placeholder: "0", reference: "Positive = more shock / firmer than baseline." },
  { key: "lrShockChange", label: "LR Shock Change", placeholder: "0", reference: "Track LR shock direction from your baseline." },
  { key: "rrShockChange", label: "RR Shock Change", placeholder: "0", reference: "Use the same unit consistently so trends stay useful." },
];

const noteFields: Array<{
  key: ChassisDataFieldKey;
  label: string;
  placeholder: string;
  reference: string;
}> = [
  {
    key: "ballastLocation",
    label: "Ballast Location",
    placeholder: "40 lb behind seat, 20 lb left of driveshaft tunnel",
    reference: "Use text here so your crew can capture both weight amount and exact placement.",
  },
  {
    key: "wheelbaseNotes",
    label: "Wheelbase Notes",
    placeholder: "LF-RR 108.0, RF-LR 107.5, pull bar indexed 1 turn",
    reference: "Wheelbase is usually recorded as measurements plus notes about split or indexing.",
  },
  {
    key: "frameAttitude",
    label: "Frame Attitude",
    placeholder: "Nose down 0.5 in, mild rake, neutral on scales",
    reference: "Keep frame attitude as a note field so you can capture rake, visual stance, and scale impressions together.",
  },
];

function sanitizeDecimalInput(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");

  if (parts.length <= 1) {
    return cleaned;
  }

  return `${parts[0]}.${parts.slice(1).join("")}`;
}

export default function ChassisScreen() {
  const chassisSetup = useAppStore((state) => state.chassisSetup);
  const raceCarType = useAppStore((state) => state.raceCarType);
  const carClass = useAppStore((state) => state.carClass);
  const saveChassisSetup = useAppStore((state) => state.saveChassisSetup);
  const [draftSetup, setDraftSetup] = useState<ChassisSetup>(chassisSetup);
  const [showBuilderMenu, setShowBuilderMenu] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    rideHeights: false,
    wingSetup: false,
    weightPercentages: false,
    adjustmentModel: false,
    notes: false,
  });

  useEffect(() => {
    setDraftSetup(chassisSetup);
  }, [chassisSetup]);

  const selectedBuilder = (draftSetup.chassisBuilder || "Generic Dirt Modified") as ChassisBuilderOption;
  const builderBaseline =
    chassisBuilderBaselines[selectedBuilder] ?? chassisBuilderBaselines["Generic Dirt Modified"];
  const getBuilderPlaceholder = (
    key:
      | "rideHeightLf"
      | "rideHeightRf"
      | "rideHeightLr"
      | "rideHeightRr"
      | "crossweightWedge"
      | "leftSidePercentage"
      | "rearPercentage"
      | "ballastLocation"
      | "wheelbaseNotes"
      | "frameAttitude",
    fallback: string,
  ) => builderBaseline[key] || fallback;

  const handleNumericChange = (key: ChassisFieldKey, value: string) => {
    const nextValue = sanitizeDecimalInput(value);

    setDraftSetup((current) => {
      const nextSetup = {
        ...current,
        [key]: nextValue,
      };

      if (key === "scaleLf" || key === "scaleRf" || key === "scaleLr" || key === "scaleRr") {
        const calculated = calculateScalePercentages({
          lf: nextSetup.scaleLf,
          rf: nextSetup.scaleRf,
          lr: nextSetup.scaleLr,
          rr: nextSetup.scaleRr,
        });

        if (calculated) {
          nextSetup.crossweightWedge = calculated.crossweightWedge;
          nextSetup.leftSidePercentage = calculated.leftSidePercentage;
          nextSetup.rearPercentage = calculated.rearPercentage;
        }
      }

      return nextSetup;
    });
  };

  const handleTextChange = (key: ChassisFieldKey, value: string) => {
    setDraftSetup((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleFractionMeasurementChange = (key: ChassisFieldKey, value: string) => {
    setDraftSetup((current) => ({
      ...current,
      [key]: sanitizeFractionMeasurementInput(value),
    }));
  };

  const handleFractionMeasurementBlur = (key: ChassisFieldKey) => {
    setDraftSetup((current) => ({
      ...current,
      [key]: normalizeFractionMeasurementInput(current[key]),
    }));
  };

  const handleBuilderSelect = (builder: string) => {
    setDraftSetup((current) => ({
      ...current,
      chassisBuilder: builder,
    }));
    setShowBuilderMenu(false);
  };

  const handleSave = async () => {
    try {
      await saveChassisSetup(draftSetup);
      Alert.alert("Saved", "Chassis setup notes were saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save chassis setup.";
      Alert.alert("Save failed", message);
    }
  };

  const dismissKeyboardOnBackgroundTap = (event: GestureResponderEvent) => {
    if (event.target === event.currentTarget) {
      Keyboard.dismiss();
      setShowBuilderMenu(false);
    }
  };

  const backgroundDismissProps = {
    onStartShouldSetResponder: () => true,
    onResponderRelease: dismissKeyboardOnBackgroundTap,
  } as const;

  const estimatedEffect = useMemo(
    () =>
      calculateEstimatedScaleEffect({
        scaleLf: draftSetup.scaleLf,
        scaleRf: draftSetup.scaleRf,
        scaleLr: draftSetup.scaleLr,
        scaleRr: draftSetup.scaleRr,
        lfJackBoltTurns: draftSetup.lfJackBoltTurns,
        rfJackBoltTurns: draftSetup.rfJackBoltTurns,
        lrJackBoltTurns: draftSetup.lrJackBoltTurns,
        rrJackBoltTurns: draftSetup.rrJackBoltTurns,
        ballastChangeLbs: draftSetup.ballastChangeLbs,
        ballastLocationZone: draftSetup.ballastLocationZone,
        lfSpringChange: draftSetup.lfSpringChange,
        rfSpringChange: draftSetup.rfSpringChange,
        lrSpringChange: draftSetup.lrSpringChange,
        rrSpringChange: draftSetup.rrSpringChange,
        lfShockChange: draftSetup.lfShockChange,
        rfShockChange: draftSetup.rfShockChange,
        lrShockChange: draftSetup.lrShockChange,
        rrShockChange: draftSetup.rrShockChange,
      }),
    [draftSetup],
  );
  const isWingSprintCar =
    raceCarType === "Sprint Car" && (carClass?.trim().startsWith("Wing Sprint") ?? false);

  return (
      <KeyboardScreen
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
      <View onStartShouldSetResponder={() => true} onResponderRelease={dismissKeyboardOnBackgroundTap}>
        <Text style={styles.h1}>Chassis</Text>
        <Text style={styles.p}>
          Choose a chassis builder to load builder-specific baseline placeholders, then save
          your team&apos;s actual baseline over the top.
        </Text>
      </View>

      <View
        style={styles.card}
        onStartShouldSetResponder={() => true}
        onResponderRelease={dismissKeyboardOnBackgroundTap}
      >
        <Text style={styles.label}>Chassis Builder</Text>
        <View style={styles.dropdownWrap}>
          <Pressable
            onPress={() => setShowBuilderMenu((current) => !current)}
            style={styles.dropdownButton}
          >
            <Text style={draftSetup.chassisBuilder ? styles.dropdownValue : styles.dropdownPlaceholder}>
              {draftSetup.chassisBuilder || "Select chassis builder"}
            </Text>
            <Text style={styles.dropdownCaret}>{showBuilderMenu ? "^" : "v"}</Text>
          </Pressable>

          {showBuilderMenu ? (
            <View style={styles.menu}>
              {chassisBuilderOptions.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => handleBuilderSelect(option)}
                  style={[
                    styles.menuItem,
                    selectedBuilder === option ? styles.menuItemActive : undefined,
                  ]}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      selectedBuilder === option ? styles.menuItemTextActive : undefined,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <Text style={styles.reference}>
          {selectedBuilder === "GRT Modified"
            ? "GRT placeholders are seeded from verified public builder setup-help material. Other builders stay generic until you add builder-specific numbers."
            : "Builder placeholders stay generic unless a verified builder baseline has been mapped in the app yet."}
        </Text>

        <Pressable
          onPress={() =>
            setExpandedSections((current) => ({
              ...current,
              rideHeights: !current.rideHeights,
            }))
          }
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>Ride Heights</Text>
          <Text style={styles.sectionArrow}>{expandedSections.rideHeights ? "▲" : "▼"}</Text>
        </Pressable>
        {expandedSections.rideHeights ? (
          <>
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.sectionBody}>
                Track each corner separately so your baseline is measurable and repeatable.
              </Text>
            </Pressable>

            <View style={styles.grid}>
              {rideHeightFields.map((field) => (
                <View key={field.key} style={styles.gridField}>
                  <Pressable onPress={Keyboard.dismiss}>
                    <Text style={styles.label}>{field.label}</Text>
                  </Pressable>
                  <TextInput
                    value={draftSetup[field.key]}
                    onChangeText={(value) => handleFractionMeasurementChange(field.key, value)}
                    onBlur={() => handleFractionMeasurementBlur(field.key)}
                    placeholder={getBuilderPlaceholder(field.key as keyof typeof builderBaseline, field.placeholder)}
                    placeholderTextColor="#5E7B94"
                    keyboardType="numbers-and-punctuation"
                    style={styles.input}
                  />
                  <Text style={styles.reference}>{field.reference}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {isWingSprintCar ? (
          <>
            <Pressable
              onPress={() =>
                setExpandedSections((current) => ({
                  ...current,
                  wingSetup: !current.wingSetup,
                }))
              }
              style={styles.sectionHeader}
            >
              <Text style={styles.sectionTitle}>Wing Setup</Text>
              <Text style={styles.sectionArrow}>{expandedSections.wingSetup ? "▲" : "▼"}</Text>
            </Pressable>
            {expandedSections.wingSetup ? (
              <>
                <Pressable onPress={Keyboard.dismiss}>
                  <Text style={styles.sectionBody}>
                    Save the key wing settings here for your baseline winged sprint package.
                  </Text>
                </Pressable>
                <View style={styles.grid} {...backgroundDismissProps}>
                  {wingSprintFields.map((field) => (
                    <View key={field.key} style={styles.gridField}>
                      <Pressable onPress={Keyboard.dismiss}>
                        <Text style={styles.label}>{field.label}</Text>
                      </Pressable>
                      <TextInput
                        value={draftSetup[field.key]}
                        onChangeText={(value) => handleTextChange(field.key, value)}
                        placeholder={field.placeholder}
                        placeholderTextColor="#5E7B94"
                        style={styles.input}
                      />
                      <Pressable onPress={Keyboard.dismiss}>
                        <Text style={styles.reference}>{field.reference}</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </>
        ) : null}

        <Pressable
          onPress={() =>
            setExpandedSections((current) => ({
              ...current,
              weightPercentages: !current.weightPercentages,
            }))
          }
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>Weight Percentages</Text>
          <Text style={styles.sectionArrow}>{expandedSections.weightPercentages ? "▲" : "▼"}</Text>
        </Pressable>
        {expandedSections.weightPercentages ? (
          <>
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.sectionBody}>
                Enter corner scale weights and the percentage fields will auto-fill from those numbers.
              </Text>
            </Pressable>

            <View style={styles.grid} {...backgroundDismissProps}>
              {scaleWeightFields.map((field) => (
                <View key={field.key} style={styles.gridField}>
                  <Pressable onPress={Keyboard.dismiss}>
                    <Text style={styles.label}>{field.label}</Text>
                  </Pressable>
                  <TextInput
                    value={draftSetup[field.key]}
                    onChangeText={(value) => handleNumericChange(field.key, value)}
                    placeholder={field.placeholder}
                    placeholderTextColor="#5E7B94"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <Text style={styles.reference}>{field.reference}</Text>
                </View>
              ))}
            </View>

            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.calculatedHelper}>
                These percentages are calculated from LF + RF + LR + RR scale weights.
              </Text>
            </Pressable>

            <View style={styles.percentRow} {...backgroundDismissProps}>
              {percentFields.slice(0, 2).map((field) => (
                <View key={field.key} style={styles.gridField}>
                  <Pressable onPress={Keyboard.dismiss}>
                    <Text style={styles.label}>{field.label}</Text>
                  </Pressable>
                  <TextInput
                    value={draftSetup[field.key]}
                    onChangeText={() => {}}
                    placeholder={getBuilderPlaceholder(field.key as keyof typeof builderBaseline, field.placeholder)}
                    placeholderTextColor="#5E7B94"
                    keyboardType="decimal-pad"
                    editable={false}
                    style={[styles.input, styles.inputDisabled]}
                  />
                  <Pressable onPress={Keyboard.dismiss}>
                    <Text style={styles.reference}>{field.reference}</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.percentLeadField} {...backgroundDismissProps}>
              <View style={styles.fieldBlock}>
                <Pressable onPress={Keyboard.dismiss}>
                  <Text style={styles.label}>{percentFields[2].label}</Text>
                </Pressable>
                <TextInput
                  value={draftSetup[percentFields[2].key]}
                  onChangeText={() => {}}
                  placeholder={getBuilderPlaceholder(
                    percentFields[2].key as keyof typeof builderBaseline,
                    percentFields[2].placeholder,
                  )}
                  placeholderTextColor="#5E7B94"
                  keyboardType="decimal-pad"
                  editable={false}
                  style={[styles.input, styles.inputDisabled]}
                />
                <Pressable onPress={Keyboard.dismiss}>
                  <Text style={styles.reference}>{percentFields[2].reference}</Text>
                </Pressable>
              </View>
            </View>
          </>
        ) : null}

        <Pressable
          onPress={() =>
            setExpandedSections((current) => ({
              ...current,
              adjustmentModel: !current.adjustmentModel,
            }))
          }
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>Adjustment Model</Text>
          <Text style={styles.sectionArrow}>{expandedSections.adjustmentModel ? "▲" : "▼"}</Text>
        </Pressable>
        {expandedSections.adjustmentModel ? (
          <>
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.sectionBody}>
                Track the change inputs here. The estimate panel gives a likely direction, but the scale pads are still the source of truth.
              </Text>
            </Pressable>

            <View style={styles.grid} {...backgroundDismissProps}>
              {jackBoltFields.map((field) => (
                <View key={field.key} style={styles.gridField}>
                  <Pressable onPress={Keyboard.dismiss}>
                    <Text style={styles.label}>{field.label}</Text>
                  </Pressable>
                  <TextInput
                    value={draftSetup[field.key]}
                    onChangeText={(value) => handleNumericChange(field.key, value)}
                    placeholder={field.placeholder}
                    placeholderTextColor="#5E7B94"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <Pressable onPress={Keyboard.dismiss}>
                    <Text style={styles.reference}>{field.reference}</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.grid} {...backgroundDismissProps}>
              {springChangeFields.map((field) => (
                <View key={field.key} style={styles.gridField}>
                  <Pressable onPress={Keyboard.dismiss}>
                    <Text style={styles.label}>{field.label}</Text>
                  </Pressable>
                  <TextInput
                    value={draftSetup[field.key]}
                    onChangeText={(value) => handleNumericChange(field.key, value)}
                    placeholder={field.placeholder}
                    placeholderTextColor="#5E7B94"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <Pressable onPress={Keyboard.dismiss}>
                    <Text style={styles.reference}>{field.reference}</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.grid} {...backgroundDismissProps}>
              {shockChangeFields.map((field) => (
                <View key={field.key} style={styles.gridField}>
                  <Pressable onPress={Keyboard.dismiss}>
                    <Text style={styles.label}>{field.label}</Text>
                  </Pressable>
                  <TextInput
                    value={draftSetup[field.key]}
                    onChangeText={(value) => handleNumericChange(field.key, value)}
                    placeholder={field.placeholder}
                    placeholderTextColor="#5E7B94"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <Pressable onPress={Keyboard.dismiss}>
                    <Text style={styles.reference}>{field.reference}</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.grid} {...backgroundDismissProps}>
              <View style={styles.gridField}>
                <Pressable onPress={Keyboard.dismiss}>
                  <Text style={styles.label}>Ballast Change Lbs</Text>
                </Pressable>
                <TextInput
                  value={draftSetup.ballastChangeLbs}
                  onChangeText={(value) => handleNumericChange("ballastChangeLbs", value)}
                  placeholder="0"
                  placeholderTextColor="#5E7B94"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                <Pressable onPress={Keyboard.dismiss}>
                  <Text style={styles.reference}>Enter how many pounds were moved or added relative to baseline.</Text>
                </Pressable>
              </View>
              <View style={styles.gridField}>
                <Pressable onPress={Keyboard.dismiss}>
                  <Text style={styles.label}>Ballast Location Zone</Text>
                </Pressable>
                <TextInput
                  value={draftSetup.ballastLocationZone}
                  onChangeText={(value) => handleTextChange("ballastLocationZone", value)}
                  placeholder="LF, RF, LR, RR, Left, Rear..."
                  placeholderTextColor="#5E7B94"
                  style={styles.input}
                />
                <Pressable onPress={Keyboard.dismiss}>
                  <Text style={styles.reference}>Use simple zones like LF, LR, left, right, rear, or center rear.</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.estimateCard} {...backgroundDismissProps}>
              <Pressable onPress={Keyboard.dismiss}>
                <Text style={styles.estimateTitle}>Estimated Scale Effect</Text>
              </Pressable>
              {estimatedEffect ? (
                <>
                  <View style={styles.percentRow} {...backgroundDismissProps}>
                    <View style={styles.gridField}>
                      <Pressable onPress={Keyboard.dismiss}>
                        <Text style={styles.label}>Estimated Cross</Text>
                      </Pressable>
                      <Text style={[styles.input, styles.estimateValue]}>{estimatedEffect.estimatedCrossweightWedge}%</Text>
                    </View>
                    <View style={styles.gridField}>
                      <Pressable onPress={Keyboard.dismiss}>
                        <Text style={styles.label}>Estimated Left</Text>
                      </Pressable>
                      <Text style={[styles.input, styles.estimateValue]}>{estimatedEffect.estimatedLeftSidePercentage}%</Text>
                    </View>
                  </View>
                  <View style={styles.percentLeadField} {...backgroundDismissProps}>
                    <Pressable onPress={Keyboard.dismiss}>
                      <Text style={styles.label}>Estimated Rear</Text>
                    </Pressable>
                    <Text style={[styles.input, styles.estimateValue]}>{estimatedEffect.estimatedRearPercentage}%</Text>
                  </View>
                  {estimatedEffect.handlingNotes.length ? (
                    <View style={styles.effectNotes}>
                      {estimatedEffect.handlingNotes.map((note) => (
                        <Pressable key={note} onPress={Keyboard.dismiss}>
                          <Text style={styles.effectNoteText}>
                            {note}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <Pressable onPress={Keyboard.dismiss}>
                      <Text style={styles.reference}>Add adjustment inputs above to see estimated handling trends.</Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <Pressable onPress={Keyboard.dismiss}>
                  <Text style={styles.reference}>
                    Enter all four scale weights first, then the app can estimate how your adjustments may shift the percentages.
                  </Text>
                </Pressable>
              )}
            </View>
          </>
        ) : null}

        <Pressable
          onPress={() =>
            setExpandedSections((current) => ({
              ...current,
              notes: !current.notes,
            }))
          }
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>Position & Notes</Text>
          <Text style={styles.sectionArrow}>{expandedSections.notes ? "▲" : "▼"}</Text>
        </Pressable>
        {expandedSections.notes ? (
          <>
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.sectionBody}>
                These fields stay as text because teams usually need measurements plus context.
              </Text>
            </Pressable>

            {noteFields.map((field) => (
              <View key={field.key} style={styles.fieldBlock} {...backgroundDismissProps}>
                <Pressable onPress={Keyboard.dismiss}>
                  <Text style={styles.label}>{field.label}</Text>
                </Pressable>
                <TextInput
                  value={draftSetup[field.key]}
                  onChangeText={(value) => handleTextChange(field.key, value)}
                  placeholder={getBuilderPlaceholder(field.key as keyof typeof builderBaseline, field.placeholder)}
                  placeholderTextColor="#5E7B94"
                  multiline
                  textAlignVertical="top"
                  style={[styles.input, styles.inputMultiline]}
                />
                <Pressable onPress={Keyboard.dismiss}>
                  <Text style={styles.reference}>{field.reference}</Text>
                </Pressable>
              </View>
            ))}
          </>
        ) : null}

        <Pressable onPress={handleSave} style={styles.button}>
          <Text style={styles.buttonText}>Save Chassis Setup</Text>
        </Pressable>
      </View>
      </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    padding: spacing(2),
  },
  h1: {
    color: "#8ED4FF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: spacing(1),
    textAlign: "center",
  },
  p: {
    color: colors.subtext,
    fontSize: 16,
    lineHeight: 20,
    marginBottom: spacing(1.5),
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing(2),
  },
  dropdownWrap: {
    marginBottom: spacing(1),
  },
  dropdownButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "#21486A",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownValue: {
    color: "#F3FAFF",
    fontSize: 16,
    fontWeight: "700",
  },
  dropdownPlaceholder: {
    color: "#6C8CA5",
    fontSize: 16,
  },
  dropdownCaret: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "800",
  },
  menu: {
    backgroundColor: "#0E223B",
    borderWidth: 1,
    borderColor: "#21486A",
    borderRadius: 16,
    marginTop: 8,
    overflow: "hidden",
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: "rgba(33,72,106,0.55)",
  },
  menuItemActive: {
    backgroundColor: "#1780D4",
  },
  menuItemText: {
    color: "#A9C7DD",
    fontSize: 15,
    fontWeight: "700",
  },
  menuItemTextActive: {
    color: "#F3FAFF",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: spacing(0.5),
    textAlign: "center",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: spacing(1.25),
    marginTop: spacing(1.25),
    position: "relative",
  },
  sectionArrow: {
    color: "#8ED4FF",
    fontSize: 13,
    fontWeight: "800",
    position: "absolute",
    right: 0,
  },
  sectionBody: {
    color: colors.subtext,
    fontSize: 11,
    lineHeight: 20,
    marginBottom: spacing(1.5),
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing(1.5),
    marginBottom: spacing(1.5),
  },
  gridField: {
    width: "47%",
  },
  fieldBlock: {
    marginBottom: spacing(2),
  },
  percentLeadField: {
    alignSelf: "center",
    marginBottom: spacing(0.5),
    marginTop: spacing(0.25),
    width: "72%",
  },
  percentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing(1.5),
    marginBottom: spacing(1.5),
  },
  calculatedHelper: {
    color: "#87AFCB",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing(1.25),
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
  estimateValue: {
    fontWeight: "800",
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
    color: "#8ED4FF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: spacing(0.5),
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#0E223B",
    borderWidth: 1,
    borderColor: "#21486A",
    borderRadius: 16,
    color: "#EAF7FF",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: spacing(0.75),
    textAlign: "center",
  },
  inputMultiline: {
    minHeight: 92,
    textAlign: "left",
  },
  inputDisabled: {
    backgroundColor: "#091522",
    borderColor: "#163046",
    color: "#6E8BA3",
  },
  reference: {
    color: "#87AFCB",
    fontSize: 11,
    lineHeight: 20,
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#1780D4",
    marginTop: spacing(1),
    paddingVertical: 14,
  },
  buttonText: {
    color: "#F3FAFF",
    fontSize: 15,
    fontWeight: "800",
  },
});


