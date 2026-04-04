import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import TextInput from "../components/AppTextInput";
import KeyboardScreen from "../components/KeyboardScreen";
import { dirtOvalTracks } from "../data/dirtOvalTracks";
import { racingTypeOptions } from "../data/racing";
import { useAppStore } from "../store/useAppStore";
import { colors, spacing } from "../theme";

const bankingOptions = ["High-Bank", "Semi-Bank", "Flat"] as const;
const lengthOptions = ["1/8", "1/6", "1/5", "1/4", "3/8", "1/3", "1/2", "5/8", "3/4", "1 Mile"];

export default function SavedTracksScreen() {
  const savedTracks = useAppStore((state) => state.savedTracks);
  const addSavedTrack = useAppStore((state) => state.addSavedTrack);
  const deleteSavedTrack = useAppStore((state) => state.deleteSavedTrack);
  const [name, setName] = useState("");
  const [trackType, setTrackType] = useState("Dirt Oval");
  const [banking, setBanking] = useState<(typeof bankingOptions)[number]>("Semi-Bank");
  const [length, setLength] = useState("");
  const [notes, setNotes] = useState("");
  const [showTrackTypeMenu, setShowTrackTypeMenu] = useState(false);
  const [showBankingMenu, setShowBankingMenu] = useState(false);
  const [showLengthMenu, setShowLengthMenu] = useState(false);
  const [showTrackMenu, setShowTrackMenu] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const shouldShowForm = savedTracks.length === 0 || showAddForm;

  const filteredTracks = dirtOvalTracks.filter((track) => {
    const search = name.trim().toLowerCase();
    if (!search) {
      return true;
    }

    return [track.name, track.city, track.state].some((value) =>
      value.toLowerCase().includes(search),
    );
  });

  const resetForm = () => {
    setName("");
    setTrackType("Dirt Oval");
    setBanking("Semi-Bank");
    setLength("");
    setNotes("");
    setShowTrackTypeMenu(false);
    setShowBankingMenu(false);
    setShowLengthMenu(false);
    setShowTrackMenu(false);
  };

  const handleSave = async () => {
    try {
      await addSavedTrack({ name, trackType, banking, length, notes });
      resetForm();
      setShowAddForm(false);
      Alert.alert("Saved", "Track profile saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save the track.";
      Alert.alert("Save failed", message);
    }
  };

  const handleDelete = (trackId: string, trackName: string) => {
    Alert.alert("Delete Track?", `Remove ${trackName} from saved tracks?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteSavedTrack(trackId);
        },
      },
    ]);
  };

  return (
    <KeyboardScreen
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {shouldShowForm ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Saved Track Profile</Text>

          <Text style={styles.label}>Track</Text>
          <TextInput
            style={styles.input}
            placeholder="Track name"
            placeholderTextColor="#4F7390"
            value={name}
            onChangeText={(value) => {
              setName(value);
              setShowTrackMenu(true);
            }}
          />
          {showTrackMenu ? (
            <View style={styles.menuCard}>
              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                style={styles.trackMenuScroll}
              >
                {filteredTracks.length ? (
                  filteredTracks.map((track) => (
                    <Pressable
                      key={`${track.name}-${track.state}`}
                      onPress={() => {
                        setName(track.name);
                        setShowTrackMenu(false);
                      }}
                      style={styles.menuRow}
                    >
                      <View style={styles.menuCopy}>
                        <Text style={styles.menuName}>{track.name}</Text>
                        <Text style={styles.menuLocation}>
                          {track.city}, {track.state}
                        </Text>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.menuRow}>
                    <Text style={styles.emptyMenuText}>No tracks matched that search.</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          ) : null}

          <Text style={styles.label}>Track Type</Text>
          <View style={styles.dropdownWrap}>
            <Pressable
              onPress={() => {
                setShowTrackTypeMenu((current) => !current);
                setShowBankingMenu(false);
                setShowLengthMenu(false);
                setShowTrackMenu(false);
              }}
              style={styles.dropdownButton}
            >
              <Text style={styles.dropdownValue}>{trackType}</Text>
              <Text style={styles.dropdownCaret}>{showTrackTypeMenu ? "▲" : "▼"}</Text>
            </Pressable>

            {showTrackTypeMenu ? (
              <View style={styles.menu}>
                {racingTypeOptions.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setTrackType(option);
                      setShowTrackTypeMenu(false);
                    }}
                    style={[styles.menuItem, trackType === option ? styles.menuItemActive : undefined]}
                  >
                    <Text
                      style={[
                        styles.menuItemText,
                        trackType === option ? styles.menuItemTextActive : undefined,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <Text style={styles.label}>Banking</Text>
          <View style={styles.dropdownWrap}>
            <Pressable
              onPress={() => {
                setShowBankingMenu((current) => !current);
                setShowTrackTypeMenu(false);
                setShowLengthMenu(false);
                setShowTrackMenu(false);
              }}
              style={styles.dropdownButton}
            >
              <Text style={styles.dropdownValue}>{banking}</Text>
              <Text style={styles.dropdownCaret}>{showBankingMenu ? "▲" : "▼"}</Text>
            </Pressable>

            {showBankingMenu ? (
              <View style={styles.menu}>
                {bankingOptions.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setBanking(option);
                      setShowBankingMenu(false);
                    }}
                    style={[styles.menuItem, banking === option ? styles.menuItemActive : undefined]}
                  >
                    <Text
                      style={[
                        styles.menuItemText,
                        banking === option ? styles.menuItemTextActive : undefined,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <Text style={styles.label}>Track Length</Text>
          <View style={styles.dropdownWrap}>
            <Pressable
              onPress={() => {
                setShowLengthMenu((current) => !current);
                setShowTrackTypeMenu(false);
                setShowBankingMenu(false);
                setShowTrackMenu(false);
              }}
              style={styles.dropdownButton}
            >
              <Text style={length ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {length || "Select track length"}
              </Text>
              <Text style={styles.dropdownCaret}>{showLengthMenu ? "▲" : "▼"}</Text>
            </Pressable>

            {showLengthMenu ? (
              <View style={styles.menu}>
                {lengthOptions.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setLength(option);
                      setShowLengthMenu(false);
                    }}
                    style={[styles.menuItem, length === option ? styles.menuItemActive : undefined]}
                  >
                    <Text
                      style={[
                        styles.menuItemText,
                        length === option ? styles.menuItemTextActive : undefined,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Track notes"
            placeholderTextColor="#4F7390"
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />

          <Pressable onPress={handleSave} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Save Track Profile</Text>
          </Pressable>

          {savedTracks.length ? (
            <Pressable
              onPress={() => {
                resetForm();
                setShowAddForm(false);
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Saved Tracks</Text>
        {savedTracks.length ? (
          savedTracks.map((track) => (
            <View key={track.id} style={styles.trackRow}>
              <View style={styles.trackCopy}>
                <Text style={styles.trackName}>{track.name}</Text>
                <Text style={styles.trackMeta}>
                  {track.trackType} | {track.banking} | {track.length}
                </Text>
                {track.notes ? <Text style={styles.trackNotes}>{track.notes}</Text> : null}
              </View>
              <Pressable onPress={() => handleDelete(track.id, track.name)} style={styles.deleteChip}>
                <Text style={styles.deleteChipText}>X</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            No saved tracks yet. Add the tracks your team visits most so race night can auto-fill
            their track type, banking, and length.
          </Text>
        )}

        {savedTracks.length ? (
          <Pressable
            onPress={() => setShowAddForm(true)}
            style={styles.addTrackButton}
          >
            <Text style={styles.addTrackButtonText}>Add New Track</Text>
          </Pressable>
        ) : null}
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2) },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    marginBottom: spacing(2),
    padding: spacing(2),
  },
  sectionTitle: {
    color: "#8ED4FF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: spacing(1.25),
    textAlign: "center",
    textTransform: "uppercase",
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: spacing(0.75),
  },
  input: {
    backgroundColor: "#0E223B",
    borderWidth: 1,
    borderColor: "#21486A",
    borderRadius: 16,
    color: "#EAF7FF",
    fontSize: 17,
    marginBottom: spacing(1.5),
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  notesInput: {
    minHeight: 92,
    textAlign: "left",
  },
  dropdownWrap: {
    marginBottom: spacing(1.5),
  },
  menuCard: {
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: -6,
    marginBottom: spacing(1.5),
    overflow: "hidden",
  },
  trackMenuScroll: {
    maxHeight: 240,
  },
  dropdownButton: {
    alignItems: "center",
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropdownValue: {
    color: "#F3FAFF",
    fontSize: 17,
    fontWeight: "700",
  },
  dropdownPlaceholder: {
    color: "#4F7390",
    fontSize: 17,
  },
  dropdownCaret: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "800",
  },
  menu: {
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    overflow: "hidden",
  },
  menuItem: {
    borderTopColor: "rgba(33,72,106,0.55)",
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
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
  menuRow: {
    borderTopColor: "rgba(33,72,106,0.55)",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuCopy: {
    flex: 1,
  },
  menuName: {
    color: "#EAF7FF",
    fontSize: 15,
    fontWeight: "700",
  },
  menuLocation: {
    color: "#87AFCB",
    fontSize: 13,
    marginTop: 4,
  },
  emptyMenuText: {
    color: colors.subtext,
    fontSize: 14,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: "#F3FAFF",
    fontSize: 17,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#102947",
    borderColor: "#21486A",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: spacing(1),
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: "#8ED4FF",
    fontSize: 16,
    fontWeight: "800",
  },
  trackRow: {
    alignItems: "center",
    borderTopColor: "#21486A",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing(1.25),
  },
  trackCopy: {
    flex: 1,
    paddingRight: spacing(1),
  },
  trackName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  trackMeta: {
    color: "#8ED4FF",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  trackNotes: {
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
  addTrackButton: {
    alignItems: "center",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    marginTop: spacing(1.5),
    paddingVertical: 14,
  },
  addTrackButtonText: {
    color: "#F3FAFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
