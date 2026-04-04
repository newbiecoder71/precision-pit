import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import TextInput from "../components/AppTextInput";
import { getRaceCarTypeOptions, racingTypeOptions } from "../data/racing";
import { colors } from "../theme";
import { useAppStore } from "../store/useAppStore";

export default function SettingsScreen({ navigation }: any) {
  const scrollRef = React.useRef<ScrollView>(null);
  const teamName = useAppStore((state) => state.teamName);
  const userName = useAppStore((state) => state.userName);
  const racingType = useAppStore((state) => state.racingType);
  const raceCarType = useAppStore((state) => state.raceCarType);
  const isTeamOwner = useAppStore((state) => state.isTeamOwner);
  const saveProfile = useAppStore((state) => state.saveProfile);
  const [draftUserName, setDraftUserName] = useState(userName ?? "");
  const [draftRacingType, setDraftRacingType] = useState(racingType ?? "");
  const [draftRaceCarType, setDraftRaceCarType] = useState(raceCarType ?? "");
  const [showRacingTypeMenu, setShowRacingTypeMenu] = useState(false);
  const [showRaceCarTypeMenu, setShowRaceCarTypeMenu] = useState(false);

  const raceCarOptions = getRaceCarTypeOptions(draftRacingType);

  useEffect(() => {
    setDraftUserName(userName ?? "");
    setDraftRacingType(racingType ?? "");
    setDraftRaceCarType(raceCarType ?? "");
  }, [teamName, userName, racingType, raceCarType]);

  useFocusEffect(
    React.useCallback(() => {
      const timeout = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }, 0);

      return () => clearTimeout(timeout);
    }, []),
  );

  const handleSave = async () => {
    try {
      await saveProfile(teamName, draftUserName, draftRacingType, draftRaceCarType);
      setShowRacingTypeMenu(false);
      setShowRaceCarTypeMenu(false);
      Alert.alert("Saved", "Team defaults and profile changes were saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save changes.";
      Alert.alert("Save failed", message);
    }
  };

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
      {isTeamOwner ? (
        <>
          <Text style={styles.label}>Team Name</Text>
          <View style={styles.lockedCard}>
            <Text style={styles.lockedValue}>{teamName || "Not set"}</Text>
            <Pressable
              onPress={() => navigation.getParent?.()?.navigate("Support")}
              style={styles.secondaryActionButton}
            >
              <Text style={styles.secondaryActionButtonText}>Contact Support</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Default Racing Type</Text>
          <View style={styles.dropdownWrap}>
            <Pressable
              onPress={() => {
                setShowRacingTypeMenu((current) => !current);
                setShowRaceCarTypeMenu(false);
              }}
              style={styles.dropdownButton}
            >
              <Text style={draftRacingType ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {draftRacingType || "Select racing type"}
              </Text>
              <Text style={styles.dropdownCaret}>{showRacingTypeMenu ? "▲" : "▼"}</Text>
            </Pressable>

            {showRacingTypeMenu ? (
              <View style={styles.menu}>
                {racingTypeOptions.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setDraftRacingType(option);
                      setDraftRaceCarType("");
                      setShowRacingTypeMenu(false);
                    }}
                    style={[
                      styles.menuItem,
                      draftRacingType === option ? styles.menuItemActive : undefined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.menuItemText,
                        draftRacingType === option ? styles.menuItemTextActive : undefined,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <Text style={styles.label}>Default Race Car Type</Text>
          <View style={styles.dropdownWrap}>
            <Pressable
              onPress={() => {
                if (raceCarOptions.length === 0) {
                  return;
                }

                setShowRaceCarTypeMenu((current) => !current);
                setShowRacingTypeMenu(false);
              }}
              style={[
                styles.dropdownButton,
                raceCarOptions.length === 0 ? styles.dropdownButtonDisabled : undefined,
              ]}
            >
              <Text style={draftRaceCarType ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {draftRaceCarType ||
                  (raceCarOptions.length > 0 ? "Select race car type" : "Choose racing type first")}
              </Text>
              <Text style={styles.dropdownCaret}>
                {showRaceCarTypeMenu && raceCarOptions.length > 0 ? "▲" : "▼"}
              </Text>
            </Pressable>

            {showRaceCarTypeMenu ? (
              <View style={styles.menu}>
                {raceCarOptions.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setDraftRaceCarType(option);
                      setShowRaceCarTypeMenu(false);
                    }}
                    style={[
                      styles.menuItem,
                      draftRaceCarType === option ? styles.menuItemActive : undefined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.menuItemText,
                        draftRaceCarType === option ? styles.menuItemTextActive : undefined,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <Text style={styles.helper}>
            These team defaults will drive the setup templates shown across the app.
          </Text>
        </>
      ) : null}

      <Text style={styles.label}>Driver Or Crew Chief</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#4F7390"
        value={draftUserName}
        onChangeText={setDraftUserName}
      />

      <Pressable onPress={handleSave} style={styles.button}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  label: {
    fontSize: 18,
    color: "#8ED4FF",
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    color: "#EAF7FF",
    fontSize: 20,
    borderWidth: 1,
    borderColor: "#21486A",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  lockedCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "#21486A",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 18,
    alignItems: "center",
  },
  lockedValue: {
    color: "#EAF7FF",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  secondaryActionButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.bg,
    borderColor: "#5AB3FF",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  secondaryActionButtonText: {
    color: "#CBE9FF",
    fontSize: 14,
    fontWeight: "800",
  },
  dropdownWrap: {
    marginBottom: 18,
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
  dropdownButtonDisabled: {
    opacity: 0.65,
  },
  dropdownValue: {
    color: "#F3FAFF",
    fontSize: 17,
    fontWeight: "700",
  },
  dropdownPlaceholder: {
    color: "#6C8CA5",
    fontSize: 17,
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
  emptyText: {
    color: "#6C8CA5",
    fontSize: 15,
  },
  helper: {
    color: "#87AFCB",
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
    marginBottom: 18,
  },
  button: {
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#1780D4",
    paddingVertical: 16,
  },
  buttonText: {
    color: "#F3FAFF",
    fontSize: 18,
    fontWeight: "800",
  },
});


