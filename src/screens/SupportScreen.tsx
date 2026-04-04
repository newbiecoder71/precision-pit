import React from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { colors } from "../theme";

const SUPPORT_EMAIL = "support@precision-pit.com";

export default function SupportScreen({ navigation }: any) {
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const handleEmailSupport = async () => {
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
      <Text style={styles.title}>Support</Text>
      <Text style={styles.subtitle}>
        Need help with your team, account, or race data? We’ve got a clean path for that here.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Version</Text>
        <Text style={styles.value}>{appVersion}</Text>

        <Text style={styles.label}>Support Email</Text>
        <Pressable onPress={() => void handleEmailSupport()}>
          <Text style={styles.linkValue}>{SUPPORT_EMAIL}</Text>
        </Pressable>

        <Text style={styles.label}>Team Name Changes</Text>
        <Text style={styles.value}>
          Team names are locked after creation. Contact support if a rename is ever needed.
        </Text>
      </View>

      <Pressable onPress={() => navigation.navigate("Terms")} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Terms & Conditions</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flexGrow: 1,
    padding: 20,
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
  label: {
    color: "#8ED4FF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 10,
    textTransform: "uppercase",
  },
  value: {
    color: "#EAF7FF",
    fontSize: 16,
    lineHeight: 22,
  },
  linkValue: {
    color: "#7FC8FF",
    fontSize: 16,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#1780D4",
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: "#F3FAFF",
    fontSize: 17,
    fontWeight: "800",
  },
});
