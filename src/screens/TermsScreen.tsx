import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

const LAST_UPDATED = "April 3, 2026";

export default function TermsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Terms & Conditions</Text>
      <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

      <TermsSection
        title="Acceptance"
        body="By using Precision Pit, you agree to these Terms & Conditions. If you do not agree, do not use the app."
      />

      <TermsSection
        title="Purpose Of The App"
        body="Precision Pit is a racing team management and note-taking tool intended to help users organize race events, setups, race-night information, team collaboration, and track history."
      />

      <TermsSection
        title="Account Responsibility"
        body="You are responsible for maintaining the confidentiality of your account credentials and for activity that occurs under your account. You agree to provide accurate information when creating and using your account."
      />

      <TermsSection
        title="Team Data And Permissions"
        body="Team owners and authorized team members may be able to view and update shared team data. It is your responsibility to manage access to your team carefully and remove members or revoke invites when needed."
      />

      <TermsSection
        title="Acceptable Use"
        body="You agree not to misuse the app, interfere with its operation, attempt unauthorized access, send fraudulent invites, or use the service in a way that violates applicable law."
      />

      <TermsSection
        title="User Content"
        body="You retain responsibility for the content you enter into the app, including race notes, setup data, schedules, and team information. You represent that you have the right to provide that information."
      />

      <TermsSection
        title="No Performance Guarantee"
        body="Setup suggestions, calculations, weather-related tools, race history views, and other app content are provided as informational tools only. Precision Pit does not guarantee race performance, safety outcomes, or competitive results."
      />

      <TermsSection
        title="Service Availability"
        body="We may update, change, suspend, or discontinue parts of the app at any time. Some features may depend on internet connectivity, third-party services, or compatible devices."
      />

      <TermsSection
        title="Limitation Of Liability"
        body="To the maximum extent permitted by law, Precision Pit and its operator will not be liable for indirect, incidental, special, consequential, or punitive damages, or for loss of data, profits, team opportunities, or racing results arising from the use of the app."
      />

      <TermsSection
        title="Disclaimer"
        body="The app is provided on an 'as is' and 'as available' basis without warranties of any kind, whether express or implied, except where such warranties cannot be disclaimed under applicable law."
      />

      <TermsSection
        title="Changes To These Terms"
        body="We may update these Terms & Conditions from time to time. Continued use of the app after an update means you accept the revised terms."
      />

      <TermsSection
        title="Contact"
        body="For questions about these Terms & Conditions, contact support@precision-pit.com."
      />
    </ScrollView>
  );
}

function TermsSection({ title, body }: { title: string; body: string }) {
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
