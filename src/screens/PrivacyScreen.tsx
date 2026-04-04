import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

const LAST_UPDATED = "April 3, 2026";

export default function PrivacyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

      <PolicySection
        title="Overview"
        body="Precision Pit is designed to help racing teams manage setups, race events, race-night notes, track information, and team collaboration. This Privacy Policy explains what information the app collects, how it is used, and the choices available to users."
      />

      <PolicySection
        title="Information We Collect"
        body="We may collect account and team information such as your name, email address, phone number if provided, team name, team-member roles, invite data, saved tracks, race schedules, race-night notes, setup data, and other information you choose to enter in the app."
      />

      <PolicySection
        title="How We Use Information"
        body="We use your information to create and manage your account, support team collaboration, save and sync team data, send team invites, restore your app experience across sessions, and provide racing tools such as saved setups, race history, and weather-related workflows."
      />

      <PolicySection
        title="Weather And External Services"
        body="If you use weather features, the app may use the ZIP code you enter to request weather data from third-party services. We also use Supabase for account, authentication, database, and synchronization features. Support or invite email delivery may use third-party email services."
      />

      <PolicySection
        title="How Data Is Stored"
        body="Some app data is stored locally on your device for faster access and offline continuity. Some team-related data is stored in our backend so it can be shared across team members on the same team."
      />

      <PolicySection
        title="Team Collaboration"
        body="If you are part of a team, information entered into shared team areas may be visible to authorized members of that team, depending on their role and the app feature being used."
      />

      <PolicySection
        title="Biometric Login"
        body="If you enable fingerprint login, the app stores the credentials needed for that sign-in flow using secure device storage. Biometric data itself is handled by your device operating system and is not stored by Precision Pit."
      />

      <PolicySection
        title="Data Retention"
        body="We retain information for as long as it is needed to provide the service, maintain team collaboration features, comply with legal obligations, resolve disputes, or enforce our agreements. Data stored locally on your device may remain until it is removed by the app or deleted from the device."
      />

      <PolicySection
        title="Your Choices"
        body="You can review and update parts of your profile and team defaults in the app. You can also contact support with questions about your information or to request help with account-related issues."
      />

      <PolicySection
        title="Children's Privacy"
        body="Precision Pit is not intended for children under 13, and we do not knowingly collect personal information from children under 13."
      />

      <PolicySection
        title="Policy Changes"
        body="We may update this Privacy Policy from time to time. If we make material changes, we may update the in-app policy date or provide additional notice where appropriate."
      />

      <PolicySection
        title="Contact"
        body="For privacy questions or requests, contact support@precision-pit.com."
      />
    </ScrollView>
  );
}

function PolicySection({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
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
  updated: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 18,
    textAlign: "center",
  },
  section: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  sectionTitle: {
    color: "#8ED4FF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  body: {
    color: "#D6E8F5",
    fontSize: 15,
    lineHeight: 22,
  },
});
