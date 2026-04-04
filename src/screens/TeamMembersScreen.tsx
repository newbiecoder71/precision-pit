import React, { useCallback } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, spacing } from "../theme";
import { useAppStore } from "../store/useAppStore";

export default function TeamMembersScreen({ navigation }: any) {
  const teamName = useAppStore((state) => state.teamName);
  const teamMembers = useAppStore((state) => state.teamMembers);
  const pendingInvites = useAppStore((state) => state.pendingInvites);
  const isTeamOwner = useAppStore((state) => state.isTeamOwner);
  const refreshTeamData = useAppStore((state) => state.refreshTeamData);
  const deletePendingInvite = useAppStore((state) => state.deletePendingInvite);

  useFocusEffect(
    useCallback(() => {
      void refreshTeamData();
    }, [refreshTeamData]),
  );

  const handleDeleteInvite = (inviteId: string, inviteEmail: string) => {
    Alert.alert(
      "Delete invite?",
      `Remove the pending invite for ${inviteEmail}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await deletePendingInvite(inviteId);
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : "Unable to delete invite.";
                Alert.alert("Delete failed", message);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Team Members</Text>
      <Text style={styles.subhead}>{teamName || "Your team"} crew roster and pending invites.</Text>

      {isTeamOwner ? (
        <Pressable onPress={() => navigation.navigate("InviteMember")} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Invite New Member</Text>
        </Pressable>
      ) : (
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Only the team owner can send invites. Crew members can still view the current roster.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Active Members</Text>
        {teamMembers.length ? (
          teamMembers.map((member) => (
            <View key={member.email} style={styles.row}>
              <View>
                <Text style={styles.name}>{member.name}</Text>
                <Text style={styles.email}>{member.email}</Text>
              </View>
              <Text style={styles.role}>{member.role}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No team members added yet.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pending Invites</Text>
        {pendingInvites.length ? (
          pendingInvites.map((invite) => (
            <View key={invite.id} style={styles.row}>
              <View>
                <Text style={styles.name}>{invite.email}</Text>
                <Text style={styles.email}>Waiting for invite acceptance</Text>
              </View>
              <View style={styles.pendingActions}>
                <Text style={styles.pending}>Pending</Text>
                {isTeamOwner ? (
                  <Pressable
                    onPress={() => handleDeleteInvite(invite.id, invite.email)}
                    style={styles.deleteInviteButton}
                  >
                    <Text style={styles.deleteInviteText}>Delete</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No pending invites.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing(2),
  },
  h1: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: spacing(1),
  },
  subhead: {
    color: colors.subtext,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing(2),
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    marginBottom: spacing(2),
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: "#F3FAFF",
    fontSize: 17,
    fontWeight: "800",
  },
  infoCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    marginBottom: spacing(2),
    padding: spacing(2),
  },
  infoText: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing(2),
    marginBottom: spacing(2),
  },
  sectionTitle: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing(1.5),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing(1),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#21486A",
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  email: {
    color: colors.subtext,
    fontSize: 14,
    marginTop: 4,
  },
  role: {
    color: "#39B4FF",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  pending: {
    color: "#F4C15D",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  pendingActions: {
    alignItems: "flex-end",
    gap: spacing(0.35),
  },
  deleteInviteButton: {
    borderColor: "#5AB3FF",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  deleteInviteText: {
    color: "#5AB3FF",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  emptyText: {
    color: colors.subtext,
    fontSize: 15,
  },
});

