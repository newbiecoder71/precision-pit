import React from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BIOMETRIC_CREDENTIALS_KEY,
  BIOMETRIC_ENABLED_KEY,
} from "../constants/authPreferences";
import { colors, spacing } from "../theme";
import { useAppStore } from "../store/useAppStore";

const ACCOUNT_SETTINGS_TOOLTIP_KEY = "hasSeenAccountSettingsTooltip";

export default function AccountScreen({ navigation }: any) {
  const scrollRef = React.useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const userName = useAppStore((state) => state.userName);
  const teamName = useAppStore((state) => state.teamName);
  const userEmail = useAppStore((state) => state.userEmail);
  const racingType = useAppStore((state) => state.racingType);
  const raceCarType = useAppStore((state) => state.raceCarType);
  const carClass = useAppStore((state) => state.carClass);
  const engineType = useAppStore((state) => state.engineType);
  const fuelType = useAppStore((state) => state.fuelType);
  const carburetorType = useAppStore((state) => state.carburetorType);
  const isTeamOwner = useAppStore((state) => state.isTeamOwner);
  const userId = useAppStore((state) => state.userId);
  const currentTeamRole = useAppStore((state) => state.currentTeamRole);
  const teamMembers = useAppStore((state) => state.teamMembers);
  const refreshTeamData = useAppStore((state) => state.refreshTeamData);
  const signOut = useAppStore((state) => state.signOut);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [biometricAvailable, setBiometricAvailable] = React.useState(false);
  const [showSettingsTooltip, setShowSettingsTooltip] = React.useState(false);
  const rosterRole = React.useMemo(
    () => teamMembers.find((member) => member.userId === userId)?.role,
    [teamMembers, userId],
  );
  const displayRole = rosterRole ?? currentTeamRole ?? (isTeamOwner ? "Owner" : "Crew");
  const roleLabel = displayRole === "Crew" ? "Crew Member" : displayRole;

  React.useEffect(() => {
    let isMounted = true;

    const loadBiometricState = async () => {
      try {
        const enabled = (await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY)) === "true";
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!isMounted) {
          return;
        }

        setBiometricEnabled(enabled);
        setBiometricAvailable(hasHardware && isEnrolled);
      } catch {
        if (isMounted) {
          setBiometricEnabled(false);
          setBiometricAvailable(false);
        }
      }
    };

    void loadBiometricState();
    void (async () => {
      try {
        const hasSeenTooltip = (await AsyncStorage.getItem(ACCOUNT_SETTINGS_TOOLTIP_KEY)) === "true";

        if (!isMounted) {
          return;
        }

        setShowSettingsTooltip(!hasSeenTooltip);
      } catch {
        if (isMounted) {
          setShowSettingsTooltip(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void refreshTeamData().catch((error) => {
        console.warn("Unable to refresh account team data.", error);
      });

      const timeout = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }, 0);

      return () => clearTimeout(timeout);
    }, [refreshTeamData]),
  );

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to log out.";
      Alert.alert("Log out failed", message);
    }
  };

  const handleBiometricToggle = async (nextValue: boolean) => {
    if (nextValue) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setBiometricAvailable(false);
        Alert.alert(
          "Fingerprint unavailable",
          "This device does not have fingerprint login set up yet. Add a fingerprint in the device settings first.",
        );
        return;
      }

      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
      setBiometricAvailable(true);
      setBiometricEnabled(true);

      const savedCredentials = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      if (!savedCredentials) {
        Alert.alert(
          "Fingerprint ready",
          "Fingerprint login is turned on. After your next password login, the app will save your secure login so the fingerprint button can appear on the login screen.",
        );
      }

      return;
    }

    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "false");
    await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    setBiometricEnabled(false);
  };

  const handleDismissSettingsTooltip = async () => {
    setShowSettingsTooltip(false);

    try {
      await AsyncStorage.setItem(ACCOUNT_SETTINGS_TOOLTIP_KEY, "true");
    } catch (error) {
      console.warn("Unable to save account settings tooltip preference.", error);
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: spacing(2) + insets.bottom + 24 }]}
    >
        <Image
          source={require("../../assets/icons/account.png")}
          style={styles.bannerImage}
          resizeMode="contain"
        />
        {showSettingsTooltip ? (
          <View style={styles.tooltipCard}>
            <Text style={styles.tooltipTitle}>Update Account Info</Text>
            <Text style={styles.tooltipBody}>
              To edit this account information, tap the Settings icon, make your changes, then tap
              Save Changes.
            </Text>
            <Pressable onPress={() => void handleDismissSettingsTooltip()} style={styles.tooltipButton}>
              <Text style={styles.tooltipButtonText}>Got It</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.card}>
          <Text style={styles.label}>Team</Text>
          <Text style={styles.value}>{teamName || "Not set"}</Text>

          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.value}>{userName || "Driver profile not set"}</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{userEmail || "No email on file"}</Text>

          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{roleLabel}</Text>

          <Text style={styles.label}>Track Type</Text>
          <Text style={styles.value}>{racingType || "Not set"}</Text>

          <Text style={styles.label}>Racing Type</Text>
          <Text style={styles.value}>{raceCarType || "Not set"}</Text>

          <Text style={styles.label}>Car Class</Text>
          <Text style={styles.value}>{carClass || "Not set"}</Text>

          <Text style={styles.label}>Engine Type</Text>
          <Text style={styles.value}>{engineType || "Not set"}</Text>

          <Text style={styles.label}>Fuel Type</Text>
          <Text style={styles.value}>{fuelType || "Not set"}</Text>

          <Text style={styles.label}>Carburetor Type</Text>
          <Text style={styles.value}>{carburetorType || "Not set"}</Text>

          <Pressable
            onPress={() => navigation.navigate("TeamMembers")}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>View Team Members</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("SavedTracks")}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Saved Tracks</Text>
          </Pressable>

          <View style={styles.preferenceCard}>
            <View style={styles.preferenceCopy}>
              <Text style={styles.preferenceTitle}>Fingerprint Login</Text>
              <Text style={styles.preferenceBody}>
                {biometricAvailable
                  ? "Use your saved fingerprint to get back into the app faster."
                  : "Turn this on after fingerprint is set up in your device settings."}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={(value) => {
                void handleBiometricToggle(value);
              }}
              trackColor={{ false: "#21486A", true: "#39B4FF" }}
              thumbColor={biometricEnabled ? "#F3FAFF" : "#9AB7CC"}
            />
          </View>

          <Pressable onPress={handleSignOut} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </Pressable>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing(1),
    paddingTop: spacing(0.5),
  },
  bannerImage: {
    alignSelf: "center",
    height: 220,
    width: "100%",
    marginBottom: spacing(0.25),
    marginTop: spacing(1.5),
  },
  tooltipCard: {
    backgroundColor: "#102947",
    borderColor: "#1E5B94",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing(1),
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1.25),
  },
  tooltipTitle: {
    color: "#8ED4FF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.75,
    marginBottom: spacing(0.5),
    textAlign: "center",
    textTransform: "uppercase",
  },
  tooltipBody: {
    color: "#CBE7FA",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  tooltipButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    marginTop: spacing(1),
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(0.75),
  },
  tooltipButtonText: {
    color: "#F3FAFF",
    fontSize: 14,
    fontWeight: "800",
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1.5),
  },
  label: {
    color: "#8ED4FF",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: spacing(0.15),
    textTransform: "uppercase",
    letterSpacing: 0.75,
    textAlign: "center",
  },
  value: {
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing(1),
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 999,
    backgroundColor: "#1780D4",
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: spacing(0.25),
  },
  primaryButtonText: {
    color: "#F3FAFF",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.bg,
    borderColor: "#5AB3FF",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: spacing(1.5),
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#5AB3FF",
    fontSize: 14,
    fontWeight: "800",
  },
  tertiaryButton: {
    alignItems: "center",
    alignSelf: "center",
    marginTop: spacing(0.75),
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tertiaryButtonText: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "700",
  },
  preferenceCard: {
    alignItems: "center",
    backgroundColor: "#102435",
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing(1),
    justifyContent: "space-between",
    marginTop: spacing(1),
    paddingHorizontal: spacing(1.1),
    paddingVertical: spacing(1),
  },
  preferenceCopy: {
    flex: 1,
    paddingRight: spacing(0.5),
  },
  preferenceTitle: {
    color: "#EAF7FF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: spacing(0.2),
  },
  preferenceBody: {
    color: "#A9C7DD",
    fontSize: 13,
    lineHeight: 19,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: colors.bg,
    borderColor: "#5AB3FF",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: spacing(1.5),
    paddingVertical: 14,
  },
  logoutButtonText: {
    color: "#5AB3FF",
    fontSize: 16,
    fontWeight: "800",
  },
});

