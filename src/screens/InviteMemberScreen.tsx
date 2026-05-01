import React, { useState } from "react";
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import TextInput from "../components/AppTextInput";
import KeyboardScreen from "../components/KeyboardScreen";
import { colors } from "../theme";
import { useAppStore } from "../store/useAppStore";

const androidInstallUrl = process.env.EXPO_PUBLIC_ANDROID_INSTALL_URL?.trim() ?? "";

export default function InviteMemberScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"email" | "text">("email");
  const teamName = useAppStore((state) => state.teamName);
  const inviteMember = useAppStore((state) => state.inviteMember);

  const handleInvite = async () => {
    if (!email.trim()) {
      Alert.alert("Email required", "Enter the team member's email address.");
      return;
    }

    if (deliveryMethod === "text" && !phoneNumber.trim()) {
      Alert.alert("Phone required", "Enter the team member's phone number for the text invite.");
      return;
    }

    try {
      const result = await inviteMember({
        email,
        deliveryMethod,
      });

      if (deliveryMethod === "text" && result.inviteLink) {
        const message = androidInstallUrl
          ? `You've been invited to join ${teamName || "the team"} on Precision Pit.\nInstall the app: ${androidInstallUrl}\nThen join your team: ${result.inviteLink}`
          : `You've been invited to join ${teamName || "the team"} on Precision Pit.\nJoin your team here: ${result.inviteLink}`;
        const separator = Platform.OS === "ios" ? "&" : "?";
        const smsUrl = `sms:${phoneNumber}${separator}body=${encodeURIComponent(message)}`;
        await Linking.openURL(smsUrl);

        Alert.alert(
          "Text ready",
          androidInstallUrl
            ? "Your text message app opened with the app install link and team join link."
            : "Your text message app opened with the team join link.",
        );
        navigation.goBack();
        return;
      }

      Alert.alert(
        result.emailSent ? "Invite email sent" : "Invite created",
        result.emailSent
          ? "The invite was saved in Supabase and the email was sent through Resend."
          : result.warning ||
            "The invite was saved in Supabase, but the email delivery step is not configured yet.",
      );
      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create invite.";
      Alert.alert("Invite failed", message);
    }
  };

  return (
    <KeyboardScreen style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Invite team member</Text>
      <Text style={styles.body}>
        Choose whether to send the invite by email or text message. The invite is still tied
        to the new member&apos;s email address so they can join the team inside the app.
      </Text>

      <View style={styles.deliveryRow}>
        <Pressable
          onPress={() => setDeliveryMethod("email")}
          style={[styles.deliveryButton, deliveryMethod === "email" ? styles.deliveryButtonActive : undefined]}
        >
          <Text style={[styles.deliveryButtonText, deliveryMethod === "email" ? styles.deliveryButtonTextActive : undefined]}>
            Email Invite
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setDeliveryMethod("text")}
          style={[styles.deliveryButton, deliveryMethod === "text" ? styles.deliveryButtonActive : undefined]}
        >
          <Text style={[styles.deliveryButtonText, deliveryMethod === "text" ? styles.deliveryButtonTextActive : undefined]}>
            Text Link
          </Text>
        </Pressable>
      </View>

      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#4F7390"
        value={email}
        onChangeText={setEmail}
      />

      {deliveryMethod === "text" ? (
        <TextInput
          keyboardType="phone-pad"
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor="#4F7390"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
      ) : null}

      <Pressable onPress={handleInvite} style={styles.button}>
        <Text style={styles.buttonText}>{deliveryMethod === "email" ? "Send Email Invite" : "Send Text Link"}</Text>
      </Pressable>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
  },
  body: {
    color: colors.subtext,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  deliveryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  deliveryButton: {
    alignItems: "center",
    borderColor: "#21486A",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  deliveryButtonActive: {
    backgroundColor: "#1780D4",
    borderColor: "#8ED4FF",
  },
  deliveryButtonText: {
    color: "#8ED4FF",
    fontSize: 15,
    fontWeight: "700",
  },
  deliveryButtonTextActive: {
    color: "#F3FAFF",
  },
  input: {
    backgroundColor: colors.card,
    color: "#EAF7FF",
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#21486A",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  button: {
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#1780D4",
    paddingVertical: 16,
  },
  buttonText: {
    color: "#F3FAFF",
    fontSize: 18,
    fontWeight: "800",
  },
});


