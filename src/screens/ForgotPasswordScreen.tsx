import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import TextInput from "../components/AppTextInput";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { colors } from "../theme";

export default function ForgotPasswordScreen() {
  const storedEmail = useAppStore((state) => state.userEmail);
  const [email, setEmail] = useState(storedEmail ?? "");
  const requestPasswordReset = useAppStore((state) => state.requestPasswordReset);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Missing information", "Enter your email address.");
      return;
    }

    try {
      await requestPasswordReset(email);
      Alert.alert(
        "Reset email sent",
        "Check your email for the password reset link, then open it on your phone to choose a new password.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send the password reset email.";
      Alert.alert("Forgot password failed", message);
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
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Forgot password</Text>
            <Text style={styles.body}>
              Enter the email address on your account and Precision Pit will send you a reset
              link.
            </Text>

          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#4F7390"
            value={email}
            onChangeText={setEmail}
          />

            <Pressable onPress={handleSubmit} style={styles.button}>
              <Text style={styles.buttonText}>Send Reset Email</Text>
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


