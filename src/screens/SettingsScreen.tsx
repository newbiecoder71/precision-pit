import React from "react";
import { Image, Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import AppPressable from "../components/AppPressable";
import KeyboardScreen from "../components/KeyboardScreen";
import { colors } from "../theme";
import { defaultTeamMemberPermissions, useAppStore } from "../store/useAppStore";

export default function SettingsScreen({ navigation }: any) {
  const isTeamOwner = useAppStore((state) => state.isTeamOwner);
  const userId = useAppStore((state) => state.userId);
  const teamMembers = useAppStore((state) => state.teamMembers);
  const currentMemberPermissions =
    teamMembers.find((member) => member.userId === userId)?.permissions ??
    defaultTeamMemberPermissions;
  const canManageSetupPreferences = isTeamOwner || currentMemberPermissions.editSetupPreferences;
  const canManageChecklistPreferences = isTeamOwner || currentMemberPermissions.editChecklistPreferences;
  const canSeeSettingsOptions =
    canManageSetupPreferences || canManageChecklistPreferences || isTeamOwner;

  return (
    <KeyboardScreen
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag"
    >
      {canSeeSettingsOptions ? (
        <>
          <Image
            source={require("../../assets/icons/settings.png")}
            style={styles.bannerImage}
            resizeMode="contain"
          />

          {canManageSetupPreferences ? (
            <AppPressable
              onPress={() => navigation.getParent?.()?.navigate("SetupPreferences")}
              style={styles.primaryActionButton}
            >
              <Text style={styles.primaryActionButtonText}>Setup Preferences</Text>
            </AppPressable>
          ) : null}

          {canManageChecklistPreferences ? (
            <AppPressable
              onPress={() => navigation.getParent?.()?.navigate("ChecklistPreferences")}
              style={styles.primaryActionButton}
            >
              <Text style={styles.primaryActionButtonText}>Checklist Preferences</Text>
            </AppPressable>
          ) : null}

          {isTeamOwner ? (
            <>
              <AppPressable
                onPress={() => navigation.getParent?.()?.navigate("Notifications")}
                style={styles.secondaryPreferenceButton}
              >
                <Text style={styles.secondaryPreferenceButtonText}>Notifications</Text>
              </AppPressable>

              <AppPressable
                onPress={() => navigation.getParent?.()?.navigate("PrintExportPreferences")}
                style={styles.secondaryPreferenceButton}
              >
                <Text style={styles.secondaryPreferenceButtonText}>Print / Export Preferences</Text>
              </AppPressable>

              <AppPressable
                onPress={() => navigation.getParent?.()?.navigate("About")}
                style={styles.secondaryPreferenceButton}
              >
                <Text style={styles.secondaryPreferenceButtonText}>About Precision Pit</Text>
              </AppPressable>
            </>
          ) : null}
        </>
      ) : (
        <Pressable onPress={Keyboard.dismiss} style={styles.infoCard}>
          <Text style={styles.infoText}>
            Only the owner, or team members given access by the owner, can change team settings.
            Team details can still be reviewed from the Account screen.
          </Text>
        </Pressable>
      )}
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
  bannerImage: {
    alignSelf: "center",
    height: 220,
    marginBottom: 8,
    marginTop: 30,
    width: "100%",
  },
  primaryActionButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#5AB3FF",
    borderRadius: 999,
    justifyContent: "center",
    marginBottom: 12,
    minHeight: 52,
    paddingHorizontal: 18,
  },
  primaryActionButtonText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  secondaryPreferenceButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#163247",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: 12,
    minHeight: 52,
    paddingHorizontal: 18,
  },
  secondaryPreferenceButtonText: {
    color: "#CBE9FF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 18,
    padding: 18,
  },
  infoText: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
  },
});
