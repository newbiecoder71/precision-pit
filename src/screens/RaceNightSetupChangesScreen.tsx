import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";

export default function RaceNightSetupChangesScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Setup Changes Moved</Text>
        <Text style={styles.copy}>
          Race-night setup changes now use the same Chassis, Tires, and Suspension input fields
          directly on the main Race Night screen. Open the race night and expand the Setups section
          to edit those values stage by stage.
        </Text>

        <Pressable onPress={() => navigation.goBack()} style={styles.button}>
          <Text style={styles.buttonText}>Back To Race Night</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: "center",
    padding: spacing(2),
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing(2),
    width: "100%",
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: spacing(1),
    textAlign: "center",
  },
  copy: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing(2),
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    paddingVertical: 14,
  },
  buttonText: {
    color: "#F3FAFF",
    fontSize: 15,
    fontWeight: "800",
  },
});

