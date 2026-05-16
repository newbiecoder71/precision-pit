import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TextInput from "../components/AppTextInput";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { colors } from "../theme";
import { getPasswordValidationMessage } from "../utils/password";

export default function AcceptInviteScreen({ navigation }: any) {
  const inviteLinkEmail = useAppStore((state) => state.inviteLinkEmail);
  const inviteLinkToken = useAppStore((state) => state.inviteLinkToken);
  const inviteLinkTeamName = useAppStore((state) => state.inviteLinkTeamName);
  const clearInviteLink = useAppStore((state) => state.clearInviteLink);
  const [email, setEmail] = useState(inviteLinkEmail ?? "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const acceptInvite = useAppStore((state) => state.acceptInvite);

  useEffect(() => {
    if (inviteLinkEmail) {
      setEmail(inviteLinkEmail);
    }
  }, [inviteLinkEmail]);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Missing information", "Enter your invited email address and password.");
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
      const accepted = await acceptInvite({
        email,
        phoneNumber,
        userName,
        password,
        token: inviteLinkToken,
      });

      if (!accepted) {
        Alert.alert(
          "Invite not found",
          "No pending Supabase invite exists yet for that email address.",
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to accept invite.";
      Alert.alert("Accept invite failed", message);
    }
  };

  const handleCancel = () => {
    clearInviteLink();
    navigation.navigate("Login");
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
            <Pressable onPress={handleCancel} style={styles.backButton}>
              <Text style={styles.backButtonText}>{"< Back"}</Text>
            </Pressable>

            <View style={styles.formWrap}>
              <Text style={styles.title}>
                {inviteLinkTeamName ? `Join ${inviteLinkTeamName}` : "Join Team"}
              </Text>
              <Text style={styles.body}>
                Enter the same email address the team owner invited, plus your contact details,
                and we&apos;ll attach this account to the team.
              </Text>

            {!!inviteLinkToken && (
              <Text style={styles.helper}>
                Invite link detected. Your invited email was filled in automatically.
              </Text>
            )}

            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              placeholder="Invited email address"
              placeholderTextColor="#4F7390"
              value={email}
              onChangeText={setEmail}
              onBlur={() => {
                if (!email.trim()) {
                  clearInviteLink();
                }
              }}
            />

            <TextInput
              keyboardType="phone-pad"
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="#4F7390"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />

            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#4F7390"
              value={userName}
              onChangeText={setUserName}
            />

            <View style={styles.passwordFieldWrap}>
              <TextInput
                secureTextEntry={!showPassword}
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                placeholderTextColor="#4F7390"
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                onPress={() => setShowPassword((current) => !current)}
                style={styles.passwordToggle}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color="#8ED4FF"
                />
              </Pressable>
            </View>

            <View style={styles.passwordFieldWrap}>
              <TextInput
                secureTextEntry={!showConfirmPassword}
                style={[styles.input, styles.passwordInput]}
                placeholder="Confirm password"
                placeholderTextColor="#4F7390"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Pressable
                onPress={() => setShowConfirmPassword((current) => !current)}
                style={styles.passwordToggle}
                hitSlop={8}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color="#8ED4FF"
                />
              </Pressable>
            </View>

            <Text style={styles.helper}>
              Password must be at least 8 characters and include uppercase, lowercase,
              number, and symbol.
            </Text>

              <Pressable onPress={handleSubmit} style={styles.button}>
                <Text style={styles.buttonText}>Join Team</Text>
              </Pressable>
            </View>
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 36,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    color: "#8ED4FF",
    fontSize: 16,
    fontWeight: "700",
  },
  formWrap: {
    flex: 1,
    justifyContent: "center",
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
  helper: {
    color: "#87AFCB",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
    marginTop: -2,
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
  passwordFieldWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    top: 6,
    width: 32,
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


