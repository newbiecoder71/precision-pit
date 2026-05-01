import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import TextInput from "../components/AppTextInput";
import KeyboardScreen from "../components/KeyboardScreen";
import { colors, spacing } from "../theme";
import { useAppStore } from "../store/useAppStore";
import { calculateGearRatio, formatGearRatio } from "../utils/gears";

function sanitizeNumberInput(value: string) {
  return value.replace(/[^0-9.]/g, "");
}

const quickChangeGearOptions = Array.from({ length: 25 }, (_, index) => `${18 + index}`);

export default function GearsScreen() {
  const { userName, gearInventory, addGearInventoryItem, deleteGearInventoryItem } = useAppStore();
  const [label, setLabel] = useState("");
  const [ringTeeth, setRingTeeth] = useState("");
  const [pinionTeeth, setPinionTeeth] = useState("");
  const [quickChangeTopTeeth, setQuickChangeTopTeeth] = useState("");
  const [quickChangeBottomTeeth, setQuickChangeBottomTeeth] = useState("");
  const [notes, setNotes] = useState("");
  const [activeQuickChangeField, setActiveQuickChangeField] = useState<
    "quickChangeTopTeeth" | "quickChangeBottomTeeth" | null
  >(null);

  const previewRatio = useMemo(() => {
    return calculateGearRatio(ringTeeth, pinionTeeth, quickChangeTopTeeth, quickChangeBottomTeeth);
  }, [pinionTeeth, quickChangeBottomTeeth, quickChangeTopTeeth, ringTeeth]);

  const handleAddGear = async () => {
    try {
      await addGearInventoryItem({
        label,
        ringTeeth,
        pinionTeeth,
        quickChangeTopTeeth,
        quickChangeBottomTeeth,
        notes,
      });

      setLabel("");
      setRingTeeth("");
      setPinionTeeth("");
      setQuickChangeTopTeeth("");
      setQuickChangeBottomTeeth("");
      setNotes("");
      Alert.alert("Saved", "Gear inventory item added.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save the gear item.";
      Alert.alert("Save failed", message);
    }
  };

  const handleDeleteGear = (gearId: string, gearLabel: string) => {
    Alert.alert("Delete Gear?", `Remove ${gearLabel} from the inventory?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteGearInventoryItem(gearId);
        },
      },
    ]);
  };

  return (
    <KeyboardScreen contentContainerStyle={styles.container}>
      <Pressable onPress={Keyboard.dismiss}>
        <Image
          source={require("../../assets/icons/gears.png")}
          style={styles.bannerImage}
          resizeMode="contain"
        />
      </Pressable>
      <Pressable onPress={Keyboard.dismiss}>
        <Text style={styles.p}>
          {userName
            ? `Welcome, ${userName}! Build your gear inventory here so ratios are ready when race night starts.`
            : "Build your gear inventory here so ratios are ready when race night starts."}
        </Text>
      </Pressable>

      <View style={styles.card}>
        <Pressable onPress={Keyboard.dismiss}>
          <Text style={styles.label}>Gear Label</Text>
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder="4.86 feature set"
          placeholderTextColor="#4F7390"
          value={label}
          onChangeText={setLabel}
        />

        <View style={styles.stackField}>
          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.label}>Ring Teeth</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="34"
            placeholderTextColor="#4F7390"
            value={ringTeeth}
            onChangeText={(value) => setRingTeeth(sanitizeNumberInput(value))}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.stackField}>
          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.label}>Pinion Teeth</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="7"
            placeholderTextColor="#4F7390"
            value={pinionTeeth}
            onChangeText={(value) => setPinionTeeth(sanitizeNumberInput(value))}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.quickChangeRow}>
          <View style={styles.quickChangeField}>
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.quickChangeLabel}>Top Quick-Change Gear</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setActiveQuickChangeField("quickChangeTopTeeth");
              }}
              style={[styles.input, styles.quickChangeButton]}
            >
              <Text style={quickChangeTopTeeth ? styles.inputValue : styles.inputPlaceholder}>
                {quickChangeTopTeeth || "Select"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.quickChangeField}>
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.quickChangeLabel}>Bottom Quick-Change Gear</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setActiveQuickChangeField("quickChangeBottomTeeth");
              }}
              style={[styles.input, styles.quickChangeButton]}
            >
              <Text style={quickChangeBottomTeeth ? styles.inputValue : styles.inputPlaceholder}>
                {quickChangeBottomTeeth || "Select"}
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable onPress={Keyboard.dismiss}>
          <Text style={styles.previewText}>
            {`Final Drive Ratio: ${formatGearRatio(previewRatio)}`}
          </Text>
        </Pressable>
        <Pressable onPress={Keyboard.dismiss}>
          <Text style={styles.previewHint}>
            Ring/pinion ratio multiplied by top quick-change gear divided by bottom quick-change gear
          </Text>
        </Pressable>

        <Pressable onPress={Keyboard.dismiss}>
          <Text style={styles.label}>Notes</Text>
        </Pressable>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Track size, driver preference, rear-end notes..."
          placeholderTextColor="#4F7390"
          value={notes}
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
        />

        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            void handleAddGear();
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Add Gear To Inventory</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Pressable onPress={Keyboard.dismiss}>
          <Text style={styles.sectionLabel}>Gear Inventory</Text>
        </Pressable>
        {gearInventory.length ? (
          gearInventory.map((gear) => (
            <View key={gear.id} style={styles.inventoryRow}>
              <View style={styles.inventoryCopy}>
                <Text style={styles.inventoryTitle}>{gear.label}</Text>
                <Text style={styles.inventoryMeta}>
                  Ring {gear.ringTeeth} | Pinion {gear.pinionTeeth} | Top {gear.quickChangeTopTeeth} | Bottom {gear.quickChangeBottomTeeth} | Ratio {gear.ratio || "-"}
                </Text>
                {gear.notes ? <Text style={styles.inventoryNotes}>{gear.notes}</Text> : null}
              </View>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  handleDeleteGear(gear.id, gear.label);
                }}
                style={styles.deleteChip}
              >
                <Text style={styles.deleteChipText}>X</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.emptyText}>
              No gears saved yet. Add a few quick-change sets here to start building inventory.
            </Text>
          </Pressable>
        )}
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={activeQuickChangeField !== null}
        onRequestClose={() => setActiveQuickChangeField(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {activeQuickChangeField === "quickChangeTopTeeth"
                ? "Select Top Quick-Change Gear"
                : "Select Bottom Quick-Change Gear"}
            </Text>
            <View style={styles.optionGrid}>
              {quickChangeGearOptions.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    if (activeQuickChangeField === "quickChangeTopTeeth") {
                      setQuickChangeTopTeeth(option);
                    } else if (activeQuickChangeField === "quickChangeBottomTeeth") {
                      setQuickChangeBottomTeeth(option);
                    }
                    setActiveQuickChangeField(null);
                  }}
                  style={styles.optionButton}
                >
                  <Text style={styles.optionButtonText}>{option}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => setActiveQuickChangeField(null)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardScreen>
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
  p: {
    color: colors.subtext,
    fontSize: 16,
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
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing(1.25),
    textAlign: "center",
    textTransform: "uppercase",
  },
  label: {
    color: "#8ED4FF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing(0.5),
    textAlign: "center",
    textTransform: "uppercase",
  },
  quickChangeLabel: {
    color: "#8ED4FF",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    lineHeight: 16,
    marginBottom: spacing(0.5),
    textAlign: "center",
    textTransform: "uppercase",
  },
  stackField: {
    width: "100%",
  },
  quickChangeRow: {
    flexDirection: "row",
    gap: spacing(1),
    marginBottom: spacing(0.5),
  },
  quickChangeField: {
    flex: 1,
  },
  input: {
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 16,
    borderWidth: 1,
    color: "#EAF7FF",
    fontSize: 15,
    marginBottom: spacing(1.25),
    paddingHorizontal: 14,
    paddingVertical: 14,
    textAlign: "center",
  },
  quickChangeButton: {
    justifyContent: "center",
  },
  inputValue: {
    color: "#EAF7FF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  inputPlaceholder: {
    color: "#4F7390",
    fontSize: 15,
    textAlign: "center",
  },
  notesInput: {
    minHeight: 92,
    textAlign: "left",
  },
  previewText: {
    color: "#5AB3FF",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: spacing(1.25),
    textAlign: "center",
  },
  previewHint: {
    color: colors.subtext,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing(1.25),
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
    fontSize: 15,
    fontWeight: "800",
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
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  inventoryMeta: {
    color: "#8ED4FF",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  inventoryNotes: {
    color: colors.subtext,
    fontSize: 13,
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
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    flex: 1,
    justifyContent: "center",
    padding: spacing(2),
  },
  modalCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: 440,
    padding: spacing(2),
    width: "100%",
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: spacing(1.25),
    textAlign: "center",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(0.75),
    justifyContent: "center",
    marginBottom: spacing(1.5),
  },
  optionButton: {
    alignItems: "center",
    backgroundColor: "#102947",
    borderColor: "#1E5B94",
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 58,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionButtonText: {
    color: "#F3FAFF",
    fontSize: 15,
    fontWeight: "800",
  },
  modalCloseButton: {
    alignItems: "center",
    borderColor: "#5AB3FF",
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 12,
  },
  modalCloseButtonText: {
    color: "#5AB3FF",
    fontSize: 15,
    fontWeight: "800",
  },
});
