import React from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import AppPressable from "../components/AppPressable";
import { colors, spacing } from "../theme";

const SUPPORT_EMAIL = "support@precision-pit.com";
const WEBSITE_URL = "https://www.precision-pit.com";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function AboutScreen({ navigation }: any) {
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const runtimeVersion =
    typeof Constants.expoConfig?.runtimeVersion === "string"
      ? Constants.expoConfig.runtimeVersion
      : appVersion;

  const openWebsite = async () => {
    const canOpen = await Linking.canOpenURL(WEBSITE_URL);

    if (!canOpen) {
      Alert.alert("Website unavailable", WEBSITE_URL);
      return;
    }

    await Linking.openURL(WEBSITE_URL);
  };

  const openEmail = async () => {
    const url = `mailto:${SUPPORT_EMAIL}`;
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      Alert.alert("Email unavailable", `Please contact us at ${SUPPORT_EMAIL}.`);
      return;
    }

    await Linking.openURL(url);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>About Precision Pit</Text>
      <Text style={styles.subtitle}>
        Keep your version details, support links, and policy documents in one easy place.
      </Text>

      <View style={styles.card}>
        <InfoRow label="App Version" value={appVersion} />
        <InfoRow label="Runtime Version" value={runtimeVersion} />
        <InfoRow label="Website" value="precision-pit.com" />
      </View>

      <AppPressable onPress={() => void openWebsite()} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Open Website</Text>
      </AppPressable>

      <AppPressable onPress={() => void openEmail()} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Email Support</Text>
      </AppPressable>

      <Pressable onPress={() => navigation.navigate("Privacy")} style={styles.linkButton}>
        <Text style={styles.linkButtonText}>Privacy Policy</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate("Terms")} style={styles.linkButton}>
        <Text style={styles.linkButtonText}>Terms & Conditions</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate("Support")} style={styles.linkButton}>
        <Text style={styles.linkButtonText}>Contact Precision Pit</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flexGrow: 1,
    padding: 20,
    paddingBottom: spacing(4),
  },
  title: {
    color: "#F3FAFF",
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#A9C7DD",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 18,
    padding: 18,
  },
  infoRow: {
    borderTopColor: "rgba(255,255,255,0.08)",
    borderTopWidth: 1,
    paddingVertical: spacing(0.9),
  },
  infoLabel: {
    color: "#8ED4FF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  infoValue: {
    color: "#EAF7FF",
    fontSize: 16,
    lineHeight: 22,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    marginBottom: 12,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: "#F3FAFF",
    fontSize: 17,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.bg,
    borderColor: "#5AB3FF",
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 12,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    color: "#5AB3FF",
    fontSize: 17,
    fontWeight: "800",
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  linkButtonText: {
    color: "#8ED4FF",
    fontSize: 16,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
