import React, { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppPressable from "../components/AppPressable";
import { colors, spacing } from "../theme";
import { TeamMember, TeamRole, useAppStore } from "../store/useAppStore";

const editableTeamRoles: TeamRole[] = ["Owner", "Driver", "Crew Chief", "Crew"];

export default function TeamMembersScreen({ navigation }: any) {
  const teamName = useAppStore((state) => state.teamName);
  const teamMembers = useAppStore((state) => state.teamMembers);
  const pendingInvites = useAppStore((state) => state.pendingInvites);
  const isTeamOwner = useAppStore((state) => state.isTeamOwner);
  const refreshTeamData = useAppStore((state) => state.refreshTeamData);
  const deletePendingInvite = useAppStore((state) => state.deletePendingInvite);
  const updateTeamMemberRole = useAppStore((state) => state.updateTeamMemberRole);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const canManageRoles = isTeamOwner;

  useFocusEffect(
    useCallback(() => {
      void refreshTeamData();
    }, [refreshTeamData]),
  );

  const currentOwnerId = useMemo(
    () => teamMembers.find((member) => member.role === "Owner")?.id,
    [teamMembers],
  );

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string" &&
      (error as { message: string }).message.trim()
    ) {
      return (error as { message: string }).message;
    }

    return fallback;
  };

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
                const message = getErrorMessage(error, "Unable to delete invite.");
                Alert.alert("Delete failed", message);
              }
            })();
          },
        },
      ],
    );
  };

  const submitRoleChange = (member: TeamMember, role: TeamRole) => {
    if (updatingMemberId) {
      return;
    }

    setUpdatingMemberId(member.id);
    void (async () => {
      try {
        await updateTeamMemberRole(member.id, role);
      } catch (error) {
        const message = getErrorMessage(error, "Unable to update this team-member role.");
        Alert.alert("Role update failed", message);
      } finally {
        setUpdatingMemberId(null);
      }
    })();
  };

  const handleRolePress = (member: TeamMember) => {
    if (!canManageRoles || updatingMemberId) {
      return;
    }

    if (member.role === "Owner") {
      Alert.alert(
        "Owner role",
        "To transfer ownership, tap another active member's role and choose Owner.",
      );
      return;
    }

    const roleButtons = editableTeamRoles
      .filter((role) => role !== member.role)
      .map((role) => ({
        text: role,
        onPress: () => {
          if (role === "Owner") {
            Alert.alert(
              "Transfer ownership?",
              `${member.name} will become the team owner, and your role will change to Crew.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Transfer",
                  onPress: () => submitRoleChange(member, role),
                },
              ],
            );
            return;
          }

          submitRoleChange(member, role);
        },
      }));

    Alert.alert(`Change role for ${member.name}`, "Choose the role you want to assign.", [
      ...roleButtons,
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Team Members</Text>
      <Text style={styles.subhead}>{teamName || "Your team"} crew roster and pending invites.</Text>

      {isTeamOwner ? (
        <AppPressable onPress={() => navigation.navigate("InviteMember")} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Invite New Member</Text>
        </AppPressable>
      ) : (
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Only the team owner can send invites and change team-member roles. Everyone else can still view the roster.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Active Members</Text>
        {teamMembers.length ? (
          teamMembers.map((member) => (
            <View key={member.id} style={styles.row}>
              <View style={styles.memberInfo}>
                <Text style={styles.name}>{member.name}</Text>
                <Text style={styles.email}>{member.email}</Text>
              </View>
              <View style={styles.memberActions}>
                <AppPressable
                  disabled={!canManageRoles || updatingMemberId !== null}
                  onPress={() => handleRolePress(member)}
                  style={[
                    styles.roleButton,
                    member.id === currentOwnerId ? styles.ownerRoleButton : undefined,
                    !canManageRoles ? styles.roleButtonReadOnly : undefined,
                    updatingMemberId === member.id ? styles.roleButtonBusy : undefined,
                  ]}
                >
                  <Text style={styles.roleButtonText}>
                    {updatingMemberId === member.id ? "Updating..." : member.role}
                  </Text>
                </AppPressable>
                {canManageRoles ? (
                  <Text style={styles.roleHint}>
                    {member.id === currentOwnerId ? "Tap another member to transfer owner" : "Tap to change"}
                  </Text>
                ) : null}
              </View>
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
              <View style={styles.memberInfo}>
                <Text style={styles.name}>{invite.email}</Text>
                <Text style={styles.email}>{invite.role} role selected</Text>
              </View>
              <View style={styles.pendingActions}>
                <Text style={styles.pending}>Pending</Text>
                {isTeamOwner ? (
                  <AppPressable
                    onPress={() => handleDeleteInvite(invite.id, invite.email)}
                    style={styles.deleteInviteButton}
                  >
                    <Text style={styles.deleteInviteText}>Delete</Text>
                  </AppPressable>
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
    alignItems: "flex-start",
    paddingVertical: spacing(1),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#21486A",
    gap: spacing(1),
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
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
  memberActions: {
    alignItems: "flex-end",
    gap: spacing(0.35),
    flexShrink: 0,
    marginLeft: "auto",
    maxWidth: 132,
  },
  roleButton: {
    alignItems: "center",
    backgroundColor: "#153E60",
    borderColor: "#2F7DB4",
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 96,
    maxWidth: 132,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  ownerRoleButton: {
    backgroundColor: "#115682",
    borderColor: "#5AB3FF",
  },
  roleButtonReadOnly: {
    opacity: 0.9,
  },
  roleButtonBusy: {
    opacity: 0.8,
  },
  roleButtonText: {
    color: "#EAF7FF",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    textTransform: "uppercase",
  },
  roleHint: {
    color: colors.subtext,
    fontSize: 11,
    textAlign: "right",
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

