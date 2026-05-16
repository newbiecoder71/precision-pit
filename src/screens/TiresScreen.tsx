import React, { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import TextInput from "../components/AppTextInput";
import KeyboardScreen from "../components/KeyboardScreen";
import { colors, spacing } from "../theme";
import { TireSetup, useAppStore } from "../store/useAppStore";
import {
  normalizeFractionMeasurementInput,
  sanitizeFractionMeasurementInput,
} from "../utils/measurementInputs";
import {
  calculateStaggerValue,
  formatMeasurementValue,
  type TireMeasurementDisplayMode,
} from "../utils/tireMeasurements";

const tirePositionOptions = ["LF", "RF", "LR", "RR", "Spare"] as const;
const circumferenceWholeNumberOptions = Array.from({ length: 18 }, (_, index) => `${79 + index}`);
const circumferenceFractionOptions = ["0", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8"] as const;
const TIRE_MEASUREMENT_DISPLAY_KEY = "tireMeasurementDisplay";

function sanitizeNumberInput(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length ? `${whole}.${rest.join("")}` : cleaned;
}

function TireCornerField({
  label,
  circumference,
  pressure,
  wheelOffset,
  onPressCircumference,
  onChangePressure,
  onChangeWheelOffset,
  onBlurWheelOffset,
}: {
  label: string;
  circumference: string;
  pressure: string;
  wheelOffset: string;
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

      <Pressable onPress={Keyboard.dismiss}>
        <Text style={styles.label}>Circumference</Text>
      </Pressable>
      <Pressable onPress={onPressCircumference} style={[styles.input, styles.circumferenceButton]}>
        <Text style={circumference ? styles.inputValue : styles.inputPlaceholder}>
          {circumference || "Select"}
        </Text>
      </Pressable>

      <Pressable onPress={Keyboard.dismiss}>
        <Text style={styles.label}>Pressure</Text>
      </Pressable>
      <TextInput
        style={[styles.input, styles.inputCompact]}
        placeholder=""
        placeholderTextColor="#4F7390"
        value={pressure}
        onChangeText={(value) => onChangePressure(sanitizeNumberInput(value))}
        keyboardType="decimal-pad"
      />

      <Pressable onPress={Keyboard.dismiss}>
        <Text style={styles.label}>Wheel Offset</Text>
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
    </View>
  );
}

export default function TiresScreen() {
  const {
    userName,
    tireSetup,
    tireInventory,
    saveTireSetup,
    addTireInventoryItem,
    deleteTireInventoryItem,
  } = useAppStore();

  const [draftSetup, setDraftSetup] = useState<TireSetup>(tireSetup);
  const [inventoryLabel, setInventoryLabel] = useState("");
  const [inventoryPosition, setInventoryPosition] = useState<(typeof tirePositionOptions)[number]>(
    "LF",
  );
  const [inventoryCircumference, setInventoryCircumference] = useState("");
  const [inventoryPressure, setInventoryPressure] = useState("");
  const [inventoryNotes, setInventoryNotes] = useState("");
  const [activeCircumferenceField, setActiveCircumferenceField] = useState<keyof TireSetup | null>(null);
  const [selectedWholeNumber, setSelectedWholeNumber] = useState("");
  const [selectedFraction, setSelectedFraction] = useState<(typeof circumferenceFractionOptions)[number]>("0");
  const [displayMode, setDisplayMode] = useState<TireMeasurementDisplayMode>("fraction");
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    tireSettings: true,
    tireInventory: false,
  });

  useEffect(() => {
    setDraftSetup(tireSetup);
  }, [tireSetup]);

  useEffect(() => {
    let isMounted = true;

    const loadDisplayMode = async () => {
      const storedValue = await AsyncStorage.getItem(TIRE_MEASUREMENT_DISPLAY_KEY);
      if (!isMounted) {
        return;
      }

      setDisplayMode(storedValue === "decimal" ? "decimal" : "fraction");
    };

    void loadDisplayMode();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeCircumferenceField) {
      return;
    }

    const currentValue = draftSetup[activeCircumferenceField];
    const match = currentValue.trim().match(/^(\d+)(?:\s+((?:1|3|5|7)\/8|1\/4|1\/2|3\/4))?$/);

    if (!match) {
      setSelectedWholeNumber("");
      setSelectedFraction("0");
      return;
    }

    setSelectedWholeNumber(match[1]);
    setSelectedFraction((match[2] as (typeof circumferenceFractionOptions)[number] | undefined) ?? "0");
  }, [activeCircumferenceField, draftSetup]);

  const frontStaggerValue = useMemo(
    () => calculateStaggerValue(draftSetup.lfCircumference, draftSetup.rfCircumference),
    [draftSetup.lfCircumference, draftSetup.rfCircumference],
  );
  const rearStaggerValue = useMemo(
    () => calculateStaggerValue(draftSetup.lrCircumference, draftSetup.rrCircumference),
    [draftSetup.lrCircumference, draftSetup.rrCircumference],
  );
  const frontStagger = frontStaggerValue == null ? "-" : formatMeasurementValue(frontStaggerValue, displayMode);
  const rearStagger = rearStaggerValue == null ? "-" : formatMeasurementValue(rearStaggerValue, displayMode);

  const handleSetupChange = (field: keyof TireSetup, value: string) => {
    setDraftSetup((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleWheelOffsetBlur = (field: keyof TireSetup) => {
    setDraftSetup((current) => ({
      ...current,
      [field]: normalizeFractionMeasurementInput(current[field]),
    }));
  };

  const handleOpenCircumferencePicker = (field: keyof TireSetup) => {
    setActiveCircumferenceField(field);
  };

  const handleSelectWholeNumber = (wholeNumber: string) => {
    setSelectedWholeNumber(wholeNumber);

    if (!activeCircumferenceField) {
      return;
    }

    if (selectedFraction === "0") {
      handleSetupChange(activeCircumferenceField, wholeNumber);
    }
  };

  const handleSelectFraction = (fraction: (typeof circumferenceFractionOptions)[number]) => {
    if (!activeCircumferenceField || !selectedWholeNumber) {
      return;
    }

    const nextValue = fraction === "0" ? selectedWholeNumber : `${selectedWholeNumber} ${fraction}`;
    handleSetupChange(activeCircumferenceField, nextValue);
    setSelectedFraction(fraction);
    setActiveCircumferenceField(null);
  };

  const handleChangeDisplayMode = async (nextMode: TireMeasurementDisplayMode) => {
    setDisplayMode(nextMode);
    await AsyncStorage.setItem(TIRE_MEASUREMENT_DISPLAY_KEY, nextMode);
    setShowDisplaySettings(false);
  };

  const handleSaveSetup = async () => {
    try {
      await saveTireSetup(draftSetup);
      Alert.alert("Saved", "Tire settings saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save tire settings.";
      Alert.alert("Save failed", message);
    }
  };

  const handleAddInventoryItem = async () => {
    try {
      await addTireInventoryItem({
        label: inventoryLabel,
        position: inventoryPosition,
        circumference: inventoryCircumference,
        pressure: inventoryPressure,
        notes: inventoryNotes,
      });

      setInventoryLabel("");
      setInventoryPosition("LF");
      setInventoryCircumference("");
      setInventoryPressure("");
      setInventoryNotes("");
      Alert.alert("Saved", "Tire inventory item added.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save the tire item.";
      Alert.alert("Save failed", message);
    }
  };

  const handleDeleteInventoryItem = (tireId: string, label: string) => {
    Alert.alert("Delete Tire?", `Remove ${label} from the inventory?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteTireInventoryItem(tireId);
        },
      },
    ]);
  };

  return (
    <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
      <KeyboardScreen contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image
          source={require("../../assets/icons/tires.png")}
          style={styles.bannerImage}
          resizeMode="contain"
        />

        {userName ? <Text style={styles.welcomeText}>{`Welcome, ${userName}!`}</Text> : null}
        <Text style={styles.p}>
          Save LF, RF, LR, and RR tire measurements here so race-night changes stay organized.
        </Text>

      <View style={styles.card}>
        <Pressable
          onPress={() =>
            setExpandedSections((current) => ({
              ...current,
              tireSettings: !current.tireSettings,
            }))
          }
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>Tire Settings</Text>
          <Text style={styles.sectionArrow}>{expandedSections.tireSettings ? "▲" : "▼"}</Text>
        </Pressable>

        {expandedSections.tireSettings ? (
          <>
            <Pressable onPress={Keyboard.dismiss}>
              <View style={styles.settingsInlineRow}>
                <Text style={styles.settingsInlineText}>
                  Stagger display: {displayMode === "fraction" ? "Fractions" : "Decimals"}
                </Text>
                <Pressable onPress={() => setShowDisplaySettings(true)} style={styles.settingsLinkButton}>
                  <Text style={styles.settingsLinkButtonText}>Change</Text>
                </Pressable>
              </View>
            </Pressable>

            <View style={styles.cornerGrid}>
              <TireCornerField
                label="LF"
                circumference={draftSetup.lfCircumference}
              pressure={draftSetup.lfPressure}
              wheelOffset={draftSetup.lfWheelOffset}
              onPressCircumference={() => handleOpenCircumferencePicker("lfCircumference")}
              onChangePressure={(value) => handleSetupChange("lfPressure", value)}
              onChangeWheelOffset={(value) => handleSetupChange("lfWheelOffset", value)}
              onBlurWheelOffset={() => handleWheelOffsetBlur("lfWheelOffset")}
            />
            <TireCornerField
              label="RF"
              circumference={draftSetup.rfCircumference}
              pressure={draftSetup.rfPressure}
              wheelOffset={draftSetup.rfWheelOffset}
              onPressCircumference={() => handleOpenCircumferencePicker("rfCircumference")}
              onChangePressure={(value) => handleSetupChange("rfPressure", value)}
              onChangeWheelOffset={(value) => handleSetupChange("rfWheelOffset", value)}
              onBlurWheelOffset={() => handleWheelOffsetBlur("rfWheelOffset")}
            />
            <TireCornerField
              label="LR"
              circumference={draftSetup.lrCircumference}
              pressure={draftSetup.lrPressure}
              wheelOffset={draftSetup.lrWheelOffset}
              onPressCircumference={() => handleOpenCircumferencePicker("lrCircumference")}
              onChangePressure={(value) => handleSetupChange("lrPressure", value)}
              onChangeWheelOffset={(value) => handleSetupChange("lrWheelOffset", value)}
              onBlurWheelOffset={() => handleWheelOffsetBlur("lrWheelOffset")}
            />
            <TireCornerField
              label="RR"
              circumference={draftSetup.rrCircumference}
              pressure={draftSetup.rrPressure}
              wheelOffset={draftSetup.rrWheelOffset}
              onPressCircumference={() => handleOpenCircumferencePicker("rrCircumference")}
              onChangePressure={(value) => handleSetupChange("rrPressure", value)}
              onChangeWheelOffset={(value) => handleSetupChange("rrWheelOffset", value)}
              onBlurWheelOffset={() => handleWheelOffsetBlur("rrWheelOffset")}
            />
            </View>

            <Pressable onPress={Keyboard.dismiss}>
              <View style={styles.staggerRow}>
              <View style={styles.staggerCard}>
                <Text style={styles.staggerLabel}>Front Stagger</Text>
                <Text style={styles.staggerValue}>{frontStagger}</Text>
                <Text style={styles.staggerHint}>
                  RF minus LF | {displayMode === "fraction" ? "Fractions" : "Decimals"}
                </Text>
              </View>
              <View style={styles.staggerCard}>
                <Text style={styles.staggerLabel}>Rear Stagger</Text>
                <Text style={styles.staggerValue}>{rearStagger}</Text>
                <Text style={styles.staggerHint}>
                  RR minus LR | {displayMode === "fraction" ? "Fractions" : "Decimals"}
                </Text>
              </View>
              </View>
            </Pressable>

            <Pressable onPress={handleSaveSetup} style={styles.button}>
              <Text style={styles.buttonText}>Save Tire Settings</Text>
            </Pressable>
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Pressable
          onPress={() =>
            setExpandedSections((current) => ({
              ...current,
              tireInventory: !current.tireInventory,
            }))
          }
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>Tire Inventory</Text>
          <Text style={styles.sectionArrow}>{expandedSections.tireInventory ? "▲" : "▼"}</Text>
        </Pressable>

        {expandedSections.tireInventory ? (
          <>
            <Text style={styles.label}>Tire Label</Text>
            <TextInput
              style={styles.input}
              placeholder="Left rear slick tire"
              placeholderTextColor="#4F7390"
              value={inventoryLabel}
              onChangeText={setInventoryLabel}
            />

            <Text style={styles.label}>Position</Text>
            <View style={styles.positionRow}>
              {tirePositionOptions.map((option) => {
                const isSelected = inventoryPosition === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setInventoryPosition(option)}
                    style={[styles.positionChip, isSelected ? styles.positionChipActive : undefined]}
                  >
                    <Text
                      style={[
                        styles.positionChipText,
                        isSelected ? styles.positionChipTextActive : undefined,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.inventoryGrid}>
              <View style={styles.inventoryField}>
                <Text style={styles.label}>Circumference</Text>
                <TextInput
                  style={styles.input}
                  placeholder=""
                  placeholderTextColor="#4F7390"
                  value={inventoryCircumference}
                  onChangeText={(value) => setInventoryCircumference(sanitizeNumberInput(value))}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inventoryField}>
                <Text style={styles.label}>Pressure</Text>
                <TextInput
                  style={styles.input}
                  placeholder=""
                  placeholderTextColor="#4F7390"
                  value={inventoryPressure}
                  onChangeText={(value) => setInventoryPressure(sanitizeNumberInput(value))}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Compound, wear notes, race-night observations..."
              placeholderTextColor="#4F7390"
              value={inventoryNotes}
              onChangeText={setInventoryNotes}
              multiline
              textAlignVertical="top"
            />

            <Pressable onPress={handleAddInventoryItem} style={styles.button}>
              <Text style={styles.buttonText}>Add Tire To Inventory</Text>
            </Pressable>
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Saved Inventory</Text>
        {tireInventory.length ? (
          tireInventory.map((tire) => (
            <View key={tire.id} style={styles.inventoryRow}>
              <View style={styles.inventoryCopy}>
                <Text style={styles.inventoryTitle}>{tire.label}</Text>
                <Text style={styles.inventoryMeta}>
                  {tire.position} | Circumference {tire.circumference} | Pressure {tire.pressure}
                </Text>
                {tire.notes ? <Text style={styles.inventoryNotes}>{tire.notes}</Text> : null}
              </View>
              <Pressable
                onPress={() => handleDeleteInventoryItem(tire.id, tire.label)}
                style={styles.deleteChip}
              >
                <Text style={styles.deleteChipText}>X</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            No tires saved yet. Add the team&apos;s LF, RF, LR, RR, and spare inventory here.
          </Text>
        )}
      </View>

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
          visible={showDisplaySettings}
          animationType="fade"
          transparent
          onRequestClose={() => setShowDisplaySettings(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Stagger Display</Text>
              <Text style={styles.modalHelp}>
                Choose whether the stagger calculator shows fractions or decimals.
              </Text>

              <View style={styles.optionGrid}>
                {([
                  { id: "fraction", label: "Fractions" },
                  { id: "decimal", label: "Decimals" },
                ] as const).map((option) => {
                  const isSelected = displayMode === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => {
                        void handleChangeDisplayMode(option.id);
                      }}
                      style={[styles.optionChip, isSelected ? styles.optionChipActive : undefined]}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          isSelected ? styles.optionChipTextActive : undefined,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable onPress={() => setShowDisplaySettings(false)} style={styles.modalCloseButton}>
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
  container: {
    backgroundColor: colors.bg,
    paddingBottom: spacing(2),
  },
  bannerImage: {
    alignSelf: "center",
    height: 250,
    width: "100%",
    marginBottom: spacing(0.25),
    marginTop: spacing(4),
  },
  welcomeText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: spacing(0.5),
    paddingHorizontal: spacing(2),
    textAlign: "center",
  },
  p: {
    color: colors.subtext,
    fontSize: 15,
    marginBottom: spacing(1.5),
    paddingHorizontal: spacing(2),
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing(2),
    marginHorizontal: spacing(2),
    padding: spacing(2),
  },
  sectionLabel: {
    color: "#8ED4FF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing(1.25),
    textAlign: "center",
    textTransform: "uppercase",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    position: "relative",
  },
  sectionTitle: {
    color: "#8ED4FF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
    textTransform: "uppercase",
  },
  sectionArrow: {
    color: "#8ED4FF",
    fontSize: 13,
    fontWeight: "800",
    position: "absolute",
    right: 0,
  },
  settingsInlineRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing(1.25),
    marginTop: spacing(1),
  },
  settingsInlineText: {
    color: "#87AFCB",
    fontSize: 12,
    fontWeight: "700",
  },
  settingsLinkButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  settingsLinkButtonText: {
    color: "#5AB3FF",
    fontSize: 12,
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
  label: {
    color: "#8ED4FF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: spacing(0.3),
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
    marginBottom: spacing(1),
    paddingHorizontal: 14,
    paddingVertical: 14,
    textAlign: "center",
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
  inputCompact: {
    marginBottom: 0,
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
  button: {
    alignItems: "center",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    paddingVertical: 14,
  },
  buttonText: {
    color: "#F3FAFF",
    fontSize: 14,
    fontWeight: "800",
  },
  positionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(1),
    justifyContent: "center",
    marginBottom: spacing(1.25),
  },
  positionChip: {
    alignItems: "center",
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  positionChipActive: {
    backgroundColor: "#1780D4",
    borderColor: "#8ED4FF",
  },
  positionChipText: {
    color: "#8ED4FF",
    fontSize: 12,
    fontWeight: "800",
  },
  positionChipTextActive: {
    color: "#F3FAFF",
  },
  inventoryGrid: {
    flexDirection: "row",
    gap: spacing(1.5),
  },
  inventoryField: {
    flex: 1,
  },
  notesInput: {
    minHeight: 92,
    textAlign: "left",
  },
  inventoryRow: {
    alignItems: "center",
    borderTopColor: "#21486A",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing(1.25),
  },
  inventoryCopy: {
    flex: 1,
    paddingRight: spacing(1),
  },
  inventoryTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  inventoryMeta: {
    color: "#8ED4FF",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  inventoryNotes: {
    color: colors.subtext,
    fontSize: 12,
    lineHeight: 18,
  },
  deleteChip: {
    alignItems: "center",
    backgroundColor: "#A62626",
    borderColor: "#D9534F",
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  deleteChipText: {
    color: "#FFF4F4",
    fontSize: 15,
    fontWeight: "900",
  },
  emptyText: {
    color: colors.subtext,
    fontSize: 13,
    lineHeight: 18,
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
  modalCloseButtonText: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "800",
  },
});
