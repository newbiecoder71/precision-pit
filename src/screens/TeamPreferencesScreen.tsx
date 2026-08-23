import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import KeyboardScreen from "../components/KeyboardScreen";
import {
  buildDefaultVisibilityPreferences,
  checklistPreferenceSections,
  isVisiblePreferenceSelected,
  setupPreferenceCategories,
  type VisibilityPreferences,
} from "../data/teamPreferences";
import { colors, spacing } from "../theme";
import { defaultTeamMemberPermissions, useAppStore } from "../store/useAppStore";

function CheckRow({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.checkRow}>
      <View style={[styles.checkbox, checked ? styles.checkboxChecked : undefined]}>
        {checked ? (
          <Image
            source={require("../../assets/icons/checkmark.png")}
            style={styles.checkboxMark}
            resizeMode="contain"
          />
        ) : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

export default function TeamPreferencesScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const isTeamOwner = useAppStore((state) => state.isTeamOwner);
  const userId = useAppStore((state) => state.userId);
  const teamMembers = useAppStore((state) => state.teamMembers);
  const racingType = useAppStore((state) => state.racingType);
  const setupVisibilityPreferences = useAppStore((state) => state.setupVisibilityPreferences);
  const checklistVisibilityPreferences = useAppStore((state) => state.checklistVisibilityPreferences);
  const saveTeamDisplayPreferences = useAppStore((state) => state.saveTeamDisplayPreferences);

  const [draftSetupPreferences, setDraftSetupPreferences] = useState<VisibilityPreferences>(
    setupVisibilityPreferences,
  );
  const [draftChecklistPreferences, setDraftChecklistPreferences] = useState<VisibilityPreferences>(
    checklistVisibilityPreferences,
  );
  const preferenceMode = route?.params?.mode;
  const resolvedMode = preferenceMode === "checklist" ? "checklist" : "setup";
  const currentMemberPermissions =
    teamMembers.find((member) => member.userId === userId)?.permissions ??
    defaultTeamMemberPermissions;
  const canManageResolvedMode =
    isTeamOwner ||
    (resolvedMode === "checklist"
      ? currentMemberPermissions.editChecklistPreferences
      : currentMemberPermissions.editSetupPreferences);
  const isKartingTeam = racingType === "Karting";
  const standardChecklistSections = useMemo(
    () => checklistPreferenceSections.filter((section) => !section.id.startsWith("karting-")),
    [],
  );
  const kartingChecklistSections = useMemo(
    () => checklistPreferenceSections.filter((section) => section.id.startsWith("karting-")),
    [],
  );
  const areAllKartingItemsSelected = useMemo(
    () =>
      kartingChecklistSections.every((section) =>
        section.items.every((item) =>
          isVisiblePreferenceSelected(draftChecklistPreferences, section.id, item.id),
        ),
      ),
    [draftChecklistPreferences, kartingChecklistSections],
  );

  const config = useMemo(
    () =>
      resolvedMode === "checklist"
        ? {
            heading: "Checklist Preferences",
            copy: "Choose which checklist items your team wants to see in the app.",
            sectionTitle: "Checklist Items",
            saveMessage: "Checklist preferences were saved.",
          }
        : {
            heading: "Setup Preferences",
            copy: "Choose which setup elements your team wants to see in the app.",
            sectionTitle: "Setup Elements",
            saveMessage: "Setup preferences were saved.",
          },
    [resolvedMode],
  );

  useEffect(() => {
    setDraftSetupPreferences(setupVisibilityPreferences);
  }, [setupVisibilityPreferences]);

  useEffect(() => {
    setDraftChecklistPreferences(checklistVisibilityPreferences);
  }, [checklistVisibilityPreferences]);

  const toggleSetupItem = (categoryId: string, itemId: string) => {
    setDraftSetupPreferences((current) => {
      const nextSelected = new Set(current[categoryId] ?? []);
      if (nextSelected.has(itemId)) {
        nextSelected.delete(itemId);
      } else {
        nextSelected.add(itemId);
      }

      return {
        ...current,
        [categoryId]: Array.from(nextSelected),
      };
    });
  };

  const toggleChecklistItem = (sectionId: string, itemId: string) => {
    setDraftChecklistPreferences((current) => {
      const nextSelected = new Set(current[sectionId] ?? []);
      if (nextSelected.has(itemId)) {
        nextSelected.delete(itemId);
      } else {
        nextSelected.add(itemId);
      }

      return {
        ...current,
        [sectionId]: Array.from(nextSelected),
      };
    });
  };

  const handleReset = () => {
    if (resolvedMode === "checklist") {
      setDraftChecklistPreferences(
        checklistPreferenceSections.reduce<VisibilityPreferences>((result, section) => {
          result[section.id] = [];
          return result;
        }, {}),
      );
      return;
    }

    setDraftSetupPreferences(
      setupPreferenceCategories.reduce<VisibilityPreferences>((result, category) => {
        result[category.id] = [];
        return result;
      }, {}),
    );
  };

  const handleSelectAll = () => {
    if (resolvedMode === "checklist") {
      setDraftChecklistPreferences(buildDefaultVisibilityPreferences(checklistPreferenceSections));
      return;
    }

    setDraftSetupPreferences(buildDefaultVisibilityPreferences(setupPreferenceCategories));
  };

  const handleToggleAllKarting = () => {
    setDraftChecklistPreferences((current) => {
      const nextPreferences = { ...current };

      kartingChecklistSections.forEach((section) => {
        nextPreferences[section.id] = areAllKartingItemsSelected
          ? []
          : section.items.map((item) => item.id);
      });

      return nextPreferences;
    });
  };

  const handleSave = async () => {
    try {
      await saveTeamDisplayPreferences({
        setupVisibilityPreferences: draftSetupPreferences,
        checklistVisibilityPreferences: draftChecklistPreferences,
      });
      Alert.alert("Saved", config.saveMessage, [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save the team display preferences.";
      Alert.alert("Save failed", message);
    }
  };

  if (!canManageResolvedMode) {
    return (
      <KeyboardScreen contentContainerStyle={styles.container}>
        <View style={[styles.card, styles.lockedCard]}>
          <Text style={styles.heading}>{config.heading}</Text>
          <Text style={styles.copy}>
            Only the team owner, or a team member given access by the owner, can change which{" "}
            {resolvedMode === "checklist" ? "checklist items" : "setup elements"} are shown.
          </Text>
        </View>
      </KeyboardScreen>
    );
  }

  return (
    <KeyboardScreen contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.heroCard}>
        <Text style={styles.heading}>{config.heading}</Text>
        <Text style={styles.copy}>{config.copy}</Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleSelectAll}
          style={({ pressed }) => [
            styles.actionButton,
            styles.secondaryAction,
            pressed ? styles.buttonPressed : undefined,
          ]}
        >
          <Text style={styles.secondaryActionText}>Select All</Text>
        </Pressable>
        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [
            styles.actionButton,
            styles.secondaryAction,
            pressed ? styles.buttonPressed : undefined,
          ]}
        >
          <Text style={styles.secondaryActionText}>Clear All</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{config.sectionTitle}</Text>
        {resolvedMode === "checklist"
          ? (
            <>
              {standardChecklistSections.map((section) => (
                <View key={section.id} style={styles.preferenceGroup}>
                  <Text style={styles.groupTitle}>{section.title}</Text>
                  {section.items.map((item) => (
                    <CheckRow
                      key={`${section.id}-${item.id}`}
                      label={item.label}
                      checked={isVisiblePreferenceSelected(
                        draftChecklistPreferences,
                        section.id,
                        item.id,
                      )}
                      onPress={() => toggleChecklistItem(section.id, item.id)}
                    />
                  ))}
                </View>
              ))}

              {kartingChecklistSections.length ? (
                <View style={styles.kartingSectionWrap}>
                  <Pressable onPress={handleToggleAllKarting} style={styles.kartingSectionHeaderRow}>
                    <Text style={styles.kartingSectionHeading}>Karting Items</Text>
                    <View
                      style={[
                        styles.checkbox,
                        styles.kartingHeaderCheckbox,
                        areAllKartingItemsSelected ? styles.checkboxChecked : undefined,
                      ]}
                    >
                      {areAllKartingItemsSelected ? (
                        <Image
                          source={require("../../assets/icons/checkmark.png")}
                          style={styles.checkboxMark}
                          resizeMode="contain"
                        />
                      ) : null}
                    </View>
                  </Pressable>
                  {kartingChecklistSections.map((section) => (
                    <View key={section.id} style={styles.preferenceGroup}>
                      <Text style={styles.groupTitle}>{section.title}</Text>
                      {section.items.map((item) => (
                        <CheckRow
                          key={`${section.id}-${item.id}`}
                          label={item.label}
                          checked={isVisiblePreferenceSelected(
                            draftChecklistPreferences,
                            section.id,
                            item.id,
                          )}
                          onPress={() => toggleChecklistItem(section.id, item.id)}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          )
          : setupPreferenceCategories.map((category) => (
              <View key={category.id} style={styles.preferenceGroup}>
                <Text style={styles.groupTitle}>{category.title}</Text>
                {category.items.map((item) => (
                  <CheckRow
                    key={`${category.id}-${item.id}`}
                    label={item.label}
                    checked={isVisiblePreferenceSelected(draftSetupPreferences, category.id, item.id)}
                    onPress={() => toggleSetupItem(category.id, item.id)}
                  />
                ))}
              </View>
            ))}
      </View>

      <Pressable
        onPress={() => void handleSave()}
        style={({ pressed }) => [
          styles.saveButton,
          { marginBottom: Math.max(insets.bottom, 18) + 18 },
          pressed ? styles.buttonPressed : undefined,
        ]}
      >
        <Text style={styles.saveButtonText}>Save Preferences</Text>
      </Pressable>
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
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: spacing(2),
    marginTop: spacing(2),
    padding: spacing(2),
  },
  lockedCard: {
    marginTop: spacing(4),
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
  actionsRow: {
    flexDirection: "row",
    gap: spacing(1),
    marginHorizontal: spacing(2),
    marginTop: spacing(2),
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing(1.25),
  },
  secondaryAction: {
    backgroundColor: "#163247",
    borderColor: colors.border,
    borderWidth: 1,
  },
  buttonPressed: {
    opacity: 0.78,
  },
  secondaryActionText: {
    color: "#AEDDFF",
    fontSize: 15,
    fontWeight: "800",
  },
  sectionTitle: {
    color: "#8ED4FF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: spacing(1),
    textAlign: "center",
    textTransform: "uppercase",
  },
  preferenceGroup: {
    borderTopColor: "rgba(255,255,255,0.08)",
    borderTopWidth: 1,
    paddingTop: spacing(1.5),
    marginTop: spacing(1.5),
  },
  kartingSectionWrap: {
    marginTop: spacing(2),
  },
  kartingSectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: spacing(0.25),
    marginTop: spacing(1),
  },
  kartingSectionHeading: {
    color: "#8ED4FF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
  },
  kartingHeaderCheckbox: {
    marginLeft: spacing(1),
    marginRight: 0,
  },
  groupTitle: {
    color: "#EAF7FF",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: spacing(1),
  },
  checkRow: {
    alignItems: "center",
    flexDirection: "row",
    paddingVertical: spacing(0.7),
  },
  checkbox: {
    alignItems: "center",
    backgroundColor: "#10283A",
    borderColor: "#5B8DB0",
    borderRadius: 7,
    borderWidth: 1.5,
    height: 24,
    justifyContent: "center",
    marginRight: spacing(1),
    overflow: "visible",
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: "transparent",
    borderColor: "#5AB3FF",
  },
  checkboxMark: {
    height: 25,
    left: -1,
    position: "absolute",
    top: -4,
    width: 28,
  },
  checkLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
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
