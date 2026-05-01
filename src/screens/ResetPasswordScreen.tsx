import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import TextInput from "../components/AppTextInput";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { colors } from "../theme";
import { getPasswordValidationMessage } from "../utils/password";

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const updatePassword = useAppStore((state) => state.updatePassword);

  const handleSubmit = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert("Missing information", "Enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Enter the same password in both fields.");
      return;
    }

    const passwordMessage = getPasswordValidationMessage(password);
    if (passwordMessage) {
      Alert.alert("Password requirements", passwordMessage);
      return;
    }

    try {
      await updatePassword(password);
      Alert.alert("Password updated", "Your password has been reset successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update your password.";
      Alert.alert("Reset password failed", message);
    }
  };

  return (
    <LinearGradient colors={["#09111B", "#001B2D"]} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 96 : 24}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode="none"
            keyboardShouldPersistTaps="always"
          >
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.body}>
              Choose a new password for your account. Use at least 8 characters with
              uppercase, lowercase, number, and symbol.
            </Text>

          <TextInput
            secureTextEntry
            style={styles.input}
            placeholder="New password"
            placeholderTextColor="#4F7390"
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            secureTextEntry
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor="#4F7390"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

            <Pressable onPress={handleSubmit} style={styles.button}>
              <Text style={styles.buttonText}>Update Password</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  title: {
    color: "#EFF9FF",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 12,
  },
  body: {
    color: "#A9C7DD",
    fontSize: 17,
    lineHeight: 26,
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "#21486A",
    color: "#EAF7FF",
    fontSize: 18,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  button: {
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#1780D4",
    marginTop: 6,
    paddingVertical: 16,
  },
  buttonText: {
    color: "#F3FAFF",
    fontSize: 18,
    fontWeight: "800",
  },
});


