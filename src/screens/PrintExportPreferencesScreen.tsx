import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppPressable from "../components/AppPressable";
import KeyboardScreen from "../components/KeyboardScreen";
import {
  defaultPrintExportPreferences,
  loadPrintExportPreferences,
  savePrintExportPreferences,
  type PrintExportPreferences,
} from "../utils/appPreferences";
import { colors, spacing } from "../theme";

function PreferenceToggle({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleCard}>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#21486A", true: "#39B4FF" }}
        thumbColor={value ? "#F3FAFF" : "#9AB7CC"}
      />
    </View>
  );
}

export default function PrintExportPreferencesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<PrintExportPreferences>(
    defaultPrintExportPreferences,
  );

  useEffect(() => {
    void (async () => {
      setPreferences(await loadPrintExportPreferences());
    })();
  }, []);

  const updatePreference = (key: keyof PrintExportPreferences, value: boolean) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await savePrintExportPreferences(preferences);
      Alert.alert("Saved", "Print and export preferences were saved.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save print and export preferences.";
      Alert.alert("Save failed", message);
    }
  };

  return (
    <KeyboardScreen contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heading}>Print / Export Preferences</Text>
        <Text style={styles.copy}>
          Choose what your team wants included when printing or exporting race-night reports.
        </Text>
      </View>

      <PreferenceToggle
        title="Include Weather"
        description="Show weather details for each stage in printouts and PDF exports."
        value={preferences.includeWeather}
        onValueChange={(value) => updatePreference("includeWeather", value)}
      />
      <PreferenceToggle
        title="Include Track Conditions"
        description="Include track condition details like banking, moisture, and surface notes."
        value={preferences.includeTrack}
        onValueChange={(value) => updatePreference("includeTrack", value)}
      />
      <PreferenceToggle
        title="Include Results"
        description="Keep stage lap counts, start position, and finish results in the report."
        value={preferences.includeResults}
        onValueChange={(value) => updatePreference("includeResults", value)}
      />
      <PreferenceToggle
        title="Include Setups"
        description="Include chassis, tire, suspension, and gear setup sections in reports."
        value={preferences.includeSetups}
        onValueChange={(value) => updatePreference("includeSetups", value)}
      />
      <PreferenceToggle
        title="Include Driver Notes"
        description="Add driver notes to printed and exported race-night reports."
        value={preferences.includeDriverNotes}
        onValueChange={(value) => updatePreference("includeDriverNotes", value)}
      />
      <PreferenceToggle
        title="Include Crew Notes"
        description="Add crew notes to printed and exported race-night reports."
        value={preferences.includeCrewNotes}
        onValueChange={(value) => updatePreference("includeCrewNotes", value)}
      />

      <AppPressable
        onPress={() => void handleSave()}
        style={[styles.saveButton, { marginBottom: Math.max(insets.bottom, 18) + 18 }]}
      >
        <Text style={styles.saveButtonText}>Save Print Preferences</Text>
      </AppPressable>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    paddingBottom: spacing(2),
  },
  heroCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: spacing(2),
    marginTop: spacing(3),
    padding: spacing(2),
  },
  heading: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginBottom: spacing(0.75),
    textAlign: "center",
  },
  copy: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  toggleCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: spacing(2),
    marginTop: spacing(2),
    padding: spacing(2),
  },
  toggleCopy: {
    flex: 1,
    paddingRight: spacing(1),
  },
  toggleTitle: {
    color: "#EAF7FF",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: spacing(0.35),
  },
  toggleDescription: {
    color: "#A9C7DD",
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#5AB3FF",
    borderRadius: 18,
    justifyContent: "center",
    marginHorizontal: spacing(2),
    marginTop: spacing(2),
    minHeight: 52,
    paddingHorizontal: spacing(2),
  },
  saveButtonText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
