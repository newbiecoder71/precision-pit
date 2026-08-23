import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppPressable from "../components/AppPressable";
import KeyboardScreen from "../components/KeyboardScreen";
import {
  defaultNotificationPreferences,
  loadNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
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

export default function NotificationsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    defaultNotificationPreferences,
  );

  useEffect(() => {
    void (async () => {
      setPreferences(await loadNotificationPreferences());
    })();
  }, []);

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await saveNotificationPreferences(preferences);
      Alert.alert("Saved", "Notification preferences were saved.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save notification preferences.";
      Alert.alert("Save failed", message);
    }
  };

  return (
    <KeyboardScreen contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heading}>Notifications</Text>
        <Text style={styles.copy}>
          Choose which reminders and update notices you want Precision Pit to keep ready for you as
          more alert features roll out.
        </Text>
      </View>

      <PreferenceToggle
        title="Invite Alerts"
        description="Keep reminders ready for new team invites and member activity."
        value={preferences.inviteAlerts}
        onValueChange={(value) => updatePreference("inviteAlerts", value)}
      />
      <PreferenceToggle
        title="Event Reminders"
        description="Save your preference for schedule reminders tied to upcoming events."
        value={preferences.eventReminders}
        onValueChange={(value) => updatePreference("eventReminders", value)}
      />
      <PreferenceToggle
        title="Race-Day Reminders"
        description="Keep race-day countdown reminders enabled for active race nights."
        value={preferences.raceDayReminders}
        onValueChange={(value) => updatePreference("raceDayReminders", value)}
      />
      <PreferenceToggle
        title="Update Announcements"
        description="Allow Precision Pit to flag important app updates and launch news."
        value={preferences.updateAnnouncements}
        onValueChange={(value) => updatePreference("updateAnnouncements", value)}
      />

      <AppPressable
        onPress={() => void handleSave()}
        style={[styles.saveButton, { marginBottom: Math.max(insets.bottom, 18) + 18 }]}
      >
        <Text style={styles.saveButtonText}>Save Notifications</Text>
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
