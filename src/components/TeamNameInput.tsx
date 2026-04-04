import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import TextInput from "./AppTextInput";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TeamNameInput({ onChange }: { onChange: (name: string) => void }) {
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("teamName").then((saved) => {
      if (saved) {
        setTeamName(saved);
        onChange(saved);
      }
    });
  }, []);

  const handleChange = (text: string) => {
    setTeamName(text);
    onChange(text);
    AsyncStorage.setItem("teamName", text);
  };

  return (
    <TextInput
      style={styles.input}
      placeholder="Enter your Team Name"
      value={teamName}
      onChangeText={handleChange}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00AEEF",
    textAlign: "center",
    marginVertical: 20,
    borderBottomWidth: 1,
    borderColor: "#00AEEF",
    padding: 5,
  },
});


