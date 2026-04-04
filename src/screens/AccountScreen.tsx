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

export default function AccountScreen({ navigation }: any) {
  const scrollRef = React.useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const userName = useAppStore((state) => state.userName);
  const teamName = useAppStore((state) => state.teamName);
  const userEmail = useAppStore((state) => state.userEmail);
  const racingType = useAppStore((state) => state.racingType);
  const raceCarType = useAppStore((state) => state.raceCarType);
  const isTeamOwner = useAppStore((state) => state.isTeamOwner);
  const signOut = useAppStore((state) => state.signOut);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [biometricAvailable, setBiometricAvailable] = React.useState(false);

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

    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const timeout = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }, 0);

      return () => clearTimeout(timeout);
    }, []),
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
        <View style={styles.card}>
          <Text style={styles.label}>Team</Text>
          <Text style={styles.value}>{teamName || "Not set"}</Text>

          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.value}>{userName || "Driver profile not set"}</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{userEmail || "No email on file"}</Text>

          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{isTeamOwner ? "Owner" : "Crew Member"}</Text>

          <Text style={styles.label}>Racing Type</Text>
          <Text style={styles.value}>{racingType || "Not set"}</Text>

          <Text style={styles.label}>Race Car Type</Text>
          <Text style={styles.value}>{raceCarType || "Not set"}</Text>

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

