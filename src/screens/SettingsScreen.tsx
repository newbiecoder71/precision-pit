import React, { useEffect, useState } from "react";
import { Alert, Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import TextInput from "../components/AppTextInput";
import KeyboardScreen from "../components/KeyboardScreen";
import {
  getRaceCarTypeOptions,
  getRacingTypeOptions,
  trackTypeOptions,
} from "../data/racing";
import { colors } from "../theme";
import { useAppStore } from "../store/useAppStore";

export default function SettingsScreen({ navigation }: any) {
  const scrollRef = React.useRef<KeyboardAwareScrollView>(null);
  const teamName = useAppStore((state) => state.teamName);
  const driverName = useAppStore((state) => state.driverName);
  const crewChiefName = useAppStore((state) => state.crewChiefName);
  const userName = useAppStore((state) => state.userName);
  const racingType = useAppStore((state) => state.racingType);
  const raceCarType = useAppStore((state) => state.raceCarType);
  const carClass = useAppStore((state) => state.carClass);
  const engineType = useAppStore((state) => state.engineType);
  const fuelType = useAppStore((state) => state.fuelType);
  const carburetorType = useAppStore((state) => state.carburetorType);
  const isTeamOwner = useAppStore((state) => state.isTeamOwner);
  const saveProfile = useAppStore((state) => state.saveProfile);
  const [draftDriverName, setDraftDriverName] = useState(driverName ?? "");
  const [draftCrewChiefName, setDraftCrewChiefName] = useState(crewChiefName ?? "");
  const [draftTrackType, setDraftTrackType] = useState(racingType ?? "");
  const [draftRacingType, setDraftRacingType] = useState(raceCarType ?? "");
  const [draftCarClass, setDraftCarClass] = useState(carClass ?? "");
  const [draftEngineType, setDraftEngineType] = useState(engineType ?? "");
  const [draftFuelType, setDraftFuelType] = useState(fuelType ?? "");
  const [draftCarburetorType, setDraftCarburetorType] = useState(carburetorType ?? "");
  const [showTrackTypeMenu, setShowTrackTypeMenu] = useState(false);
  const [showRacingTypeMenu, setShowRacingTypeMenu] = useState(false);
  const [showCarClassMenu, setShowCarClassMenu] = useState(false);

  const availableRacingTypes = getRacingTypeOptions(draftTrackType);
  const availableCarClasses = getRaceCarTypeOptions(draftRacingType);

  useEffect(() => {
    setDraftDriverName(driverName ?? "");
    setDraftCrewChiefName(crewChiefName ?? "");
    setDraftTrackType(racingType ?? "");
    setDraftRacingType(raceCarType ?? "");
    setDraftCarClass(carClass ?? "");
    setDraftEngineType(engineType ?? "");
    setDraftFuelType(fuelType ?? "");
    setDraftCarburetorType(carburetorType ?? "");
  }, [driverName, crewChiefName, racingType, raceCarType, carClass, engineType, fuelType, carburetorType]);

  useFocusEffect(
    React.useCallback(() => {
      const timeout = setTimeout(() => {
        scrollRef.current?.scrollToPosition?.(0, 0, false);
      }, 0);

      return () => clearTimeout(timeout);
    }, []),
  );

  const handleSave = async () => {
    try {
      await saveProfile(
        teamName,
        userName,
        draftTrackType,
        draftRacingType,
        draftCarClass,
        draftDriverName,
        draftCrewChiefName,
        draftEngineType,
        draftFuelType,
        draftCarburetorType,
      );
      setShowTrackTypeMenu(false);
      setShowRacingTypeMenu(false);
      setShowCarClassMenu(false);
      Alert.alert("Saved", "Settings were saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save changes.";
      Alert.alert("Save failed", message);
    }
  };

  return (
    <KeyboardScreen
      scrollRef={scrollRef}
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
    >
      {isTeamOwner ? (
        <>
          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.label}>Team Name</Text>
          </Pressable>
          <View style={styles.lockedCard}>
            <Text style={styles.lockedValue}>{teamName || "Not set"}</Text>
            <Pressable
              onPress={() => navigation.getParent?.()?.navigate("Support")}
              style={styles.secondaryActionButton}
            >
              <Text style={styles.secondaryActionButtonText}>Contact Precision Pit</Text>
            </Pressable>
          </View>

          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.label}>Track Type</Text>
          </Pressable>
          <View style={styles.dropdownWrap}>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setShowTrackTypeMenu((current) => !current);
                setShowRacingTypeMenu(false);
                setShowCarClassMenu(false);
              }}
              style={styles.dropdownButton}
            >
              <Text style={draftTrackType ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {draftTrackType || "Select track type"}
              </Text>
              <Text style={styles.dropdownCaret}>{showTrackTypeMenu ? "^" : "v"}</Text>
            </Pressable>

            {showTrackTypeMenu ? (
              <View style={styles.menu}>
                {trackTypeOptions.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setDraftTrackType(option);
                      setDraftRacingType("");
                      setDraftCarClass("");
                      setShowTrackTypeMenu(false);
                    }}
                    style={[
                      styles.menuItem,
                      draftTrackType === option ? styles.menuItemActive : undefined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.menuItemText,
                        draftTrackType === option ? styles.menuItemTextActive : undefined,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.label}>Racing Type</Text>
          </Pressable>
          <View style={styles.dropdownWrap}>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                if (availableRacingTypes.length === 0) {
                  return;
                }

                setShowRacingTypeMenu((current) => !current);
                setShowTrackTypeMenu(false);
                setShowCarClassMenu(false);
              }}
              style={[
                styles.dropdownButton,
                availableRacingTypes.length === 0 ? styles.dropdownButtonDisabled : undefined,
              ]}
            >
              <Text style={draftRacingType ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {draftRacingType ||
                  (availableRacingTypes.length > 0
                    ? "Select racing type"
                    : "Choose track type first")}
              </Text>
              <Text style={styles.dropdownCaret}>
                {showRacingTypeMenu && availableRacingTypes.length > 0 ? "^" : "v"}
              </Text>
            </Pressable>

            {showRacingTypeMenu ? (
              <View style={styles.menu}>
                {availableRacingTypes.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setDraftRacingType(option);
                      setDraftCarClass("");
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

          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.label}>Car Class</Text>
          </Pressable>
          <View style={styles.dropdownWrap}>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                if (availableCarClasses.length === 0) {
                  return;
                }

                setShowCarClassMenu((current) => !current);
                setShowTrackTypeMenu(false);
                setShowRacingTypeMenu(false);
              }}
              style={[
                styles.dropdownButton,
                availableCarClasses.length === 0 ? styles.dropdownButtonDisabled : undefined,
              ]}
            >
              <Text style={draftCarClass ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {draftCarClass ||
                  (availableCarClasses.length > 0 ? "Select car class" : "Choose racing type first")}
              </Text>
              <Text style={styles.dropdownCaret}>
                {showCarClassMenu && availableCarClasses.length > 0 ? "^" : "v"}
              </Text>
            </Pressable>

            {showCarClassMenu ? (
              <View style={styles.menu}>
                {availableCarClasses.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setDraftCarClass(option);
                      setShowCarClassMenu(false);
                    }}
                    style={[
                      styles.menuItem,
                      draftCarClass === option ? styles.menuItemActive : undefined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.menuItemText,
                        draftCarClass === option ? styles.menuItemTextActive : undefined,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.helper}>
              Track Type, Racing Type, and Car Class shape the setup logic shown across the app.
            </Text>
          </Pressable>

          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.label}>Engine Type</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="GM 602 crate"
            placeholderTextColor="#4F7390"
            value={draftEngineType}
            onChangeText={setDraftEngineType}
          />

          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.label}>Fuel Type</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Methanol"
            placeholderTextColor="#4F7390"
            value={draftFuelType}
            onChangeText={setDraftFuelType}
          />

          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.label}>Carburetor Type</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="2 barrel Rochester"
            placeholderTextColor="#4F7390"
            value={draftCarburetorType}
            onChangeText={setDraftCarburetorType}
          />

          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.label}>Driver</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Driver name"
            placeholderTextColor="#4F7390"
            value={draftDriverName}
            onChangeText={setDraftDriverName}
          />

          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.label}>Crew Chief</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Crew chief name"
            placeholderTextColor="#4F7390"
            value={draftCrewChiefName}
            onChangeText={setDraftCrewChiefName}
          />
        </>
      ) : (
        <Pressable onPress={Keyboard.dismiss} style={styles.infoCard}>
          <Text style={styles.infoText}>
            Only the owner can change team settings. Support for team branding is planned for a future update.
          </Text>
        </Pressable>
      )}

      <Pressable
        onPress={() => {
          Keyboard.dismiss();
          void handleSave();
        }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Save Changes</Text>
      </Pressable>
    </KeyboardScreen>
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
  helper: {
    color: "#87AFCB",
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
    marginBottom: 18,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    marginBottom: 18,
    padding: 18,
  },
  infoText: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
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
