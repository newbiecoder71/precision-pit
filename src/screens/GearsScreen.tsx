import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
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

export default function GearsScreen() {
  const { userName, gearInventory, addGearInventoryItem, deleteGearInventoryItem } = useAppStore();
  const [label, setLabel] = useState("");
  const [ringTeeth, setRingTeeth] = useState("");
  const [pinionTeeth, setPinionTeeth] = useState("");
  const [notes, setNotes] = useState("");

  const previewRatio = useMemo(() => {
    return calculateGearRatio(ringTeeth, pinionTeeth);
  }, [pinionTeeth, ringTeeth]);

  const handleAddGear = async () => {
    try {
      await addGearInventoryItem({
        label,
        ringTeeth,
        pinionTeeth,
        notes,
      });

      setLabel("");
      setRingTeeth("");
      setPinionTeeth("");
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
      <Image
        source={require("../../assets/icons/gears.png")}
        style={styles.bannerImage}
        resizeMode="contain"
      />
      <Text style={styles.p}>
        {userName
          ? `Welcome, ${userName}! Build your gear inventory here so ratios are ready when race night starts.`
          : "Build your gear inventory here so ratios are ready when race night starts."}
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Add Gear Set</Text>

        <Text style={styles.label}>Gear Label</Text>
        <TextInput
          style={styles.input}
          placeholder="4.86 quick-change set"
          placeholderTextColor="#4F7390"
          value={label}
          onChangeText={setLabel}
        />

        <View style={styles.grid}>
          <View style={styles.gridField}>
            <Text style={styles.label}>Ring Teeth</Text>
            <TextInput
              style={styles.input}
              placeholder="34"
              placeholderTextColor="#4F7390"
              value={ringTeeth}
              onChangeText={(value) => setRingTeeth(sanitizeNumberInput(value))}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.gridField}>
            <Text style={styles.label}>Pinion Teeth</Text>
            <TextInput
              style={styles.input}
              placeholder="7"
              placeholderTextColor="#4F7390"
              value={pinionTeeth}
              onChangeText={(value) => setPinionTeeth(sanitizeNumberInput(value))}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <Text style={styles.previewText}>
          {`Calculated Ratio: ${formatGearRatio(previewRatio)}`}
        </Text>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Track size, driver preference, rear-end notes..."
          placeholderTextColor="#4F7390"
          value={notes}
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
        />

        <Pressable onPress={handleAddGear} style={styles.button}>
          <Text style={styles.buttonText}>Add Gear To Inventory</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Gear Inventory</Text>
        {gearInventory.length ? (
          gearInventory.map((gear) => (
            <View key={gear.id} style={styles.inventoryRow}>
              <View style={styles.inventoryCopy}>
                <Text style={styles.inventoryTitle}>{gear.label}</Text>
                <Text style={styles.inventoryMeta}>
                  Ring {gear.ringTeeth} | Pinion {gear.pinionTeeth} | Ratio {gear.ratio || "-"}
                </Text>
                {gear.notes ? <Text style={styles.inventoryNotes}>{gear.notes}</Text> : null}
              </View>
              <Pressable
                onPress={() => handleDeleteGear(gear.id, gear.label)}
                style={styles.deleteChip}
              >
                <Text style={styles.deleteChipText}>X</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            No gears saved yet. Add a few quick-change sets here to start building inventory.
          </Text>
        )}
      </View>
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
  grid: {
    flexDirection: "row",
    gap: spacing(1.5),
  },
  gridField: {
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
});


