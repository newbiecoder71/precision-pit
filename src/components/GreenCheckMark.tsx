import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

export default function GreenCheckMark({
  style,
  scale = 1,
}: {
  style?: ViewStyle;
  scale?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        {
          transform: [{ scale }],
        },
        style,
      ]}
    >
      <View style={styles.pivotCap} />
      <View style={styles.shortStroke} />
      <View style={styles.longStroke} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 30,
    position: "absolute",
    width: 32,
  },
  pivotCap: {
    backgroundColor: "#41C615",
    borderRadius: 999,
    height: 9,
    left: 1,
    position: "absolute",
    top: 15,
    transform: [{ rotate: "38deg" }],
    width: 11,
  },
  shortStroke: {
    backgroundColor: "#41C615",
    borderRadius: 999,
    height: 6,
    left: 5,
    position: "absolute",
    top: 16,
    transform: [{ rotate: "48deg" }],
    width: 12,
  },
  longStroke: {
    backgroundColor: "#41C615",
    borderRadius: 999,
    height: 6,
    left: 10,
    position: "absolute",
    top: 12,
    transform: [{ rotate: "-42deg" }],
    width: 24,
  },
});
