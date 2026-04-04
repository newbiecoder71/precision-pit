import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../theme";
import { useAppStore } from "../store/useAppStore";

export default function ChecklistScreen() {
  const { userName } = useAppStore();
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Checklist</Text>
      <Text style={styles.p}>
        {userName ? `Welcome, ${userName}!` : "Set up your driver profile here."}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(2) },
  h1: { color: colors.text, fontSize: 24, marginBottom: spacing(1) },
  p: { color: colors.subtext, fontSize: 16 },
});

