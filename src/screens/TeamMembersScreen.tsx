import React, { useCallback, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppPressable from "../components/AppPressable";
import { colors, spacing } from "../theme";
import {
  TeamMember,
  TeamMemberPermissions,
  TeamRole,
  normalizeTeamMemberPermissions,
  useAppStore,
} from "../store/useAppStore";

const editableTeamRoles: TeamRole[] = ["Owner", "Driver", "Crew Chief", "Crew"];

const accessOptions: Array<{ key: keyof TeamMemberPermissions; label: string }> = [
  { key: "editTeamDetails", label: "Edit Team Details" },
  { key: "editTeamBranding", label: "Edit Team Branding" },
  { key: "editSetupPreferences", label: "Change Setup Preferences" },
  { key: "editChecklistPreferences", label: "Change Checklist Preferences" },
];

function CheckRow({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.checkRow}>
      <View style={[styles.checkbox, checked ? styles.checkboxChecked : undefined]}>
        {checked ? (
          <Image
            source={require("../../assets/icons/checkmark.png")}
            style={styles.checkboxMark}
            resizeMode="contain"
          />
        ) : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

export default function TeamMembersScreen({ navigation }: any) {
  const teamName = useAppStore((state) => state.teamName);
  const teamMembers = useAppStore((state) => state.teamMembers);
  const pendingInvites = useAppStore((state) => state.pendingInvites);
  const isTeamOwner = useAppStore((state) => state.isTeamOwner);
  const refreshTeamData = useAppStore((state) => state.refreshTeamData);
  const deletePendingInvite = useAppStore((state) => state.deletePendingInvite);
  const updateTeamMemberRole = useAppStore((state) => state.updateTeamMemberRole);
  const updateTeamMemberPermissions = useAppStore((state) => state.updateTeamMemberPermissions);
  const removeTeamMember = useAppStore((state) => state.removeTeamMember);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [selectedRoleMemberId, setSelectedRoleMemberId] = useState<string | null>(null);
  const [selectedAccessMemberId, setSelectedAccessMemberId] = useState<string | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<TeamMemberPermissions | null>(null);
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

    if (selectedRoleMemberId === member.id) {
      setSelectedRoleMemberId(null);
      return;
    }

    setSelectedAccessMemberId(null);
    setDraftPermissions(null);
    setSelectedRoleMemberId(member.id);
  };

  const handleRoleSelection = (member: TeamMember, role: TeamRole) => {
    if (role === "Owner") {
      Alert.alert(
        "Transfer ownership?",
        `${member.name} will become the team owner, and your role will change to Crew.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Transfer",
            onPress: () => {
              setSelectedRoleMemberId(null);
              submitRoleChange(member, role);
            },
          },
        ],
      );
      return;
    }

    setSelectedRoleMemberId(null);
    submitRoleChange(member, role);
  };

  const handleRemoveMember = (member: TeamMember) => {
    if (!canManageRoles || updatingMemberId) {
      return;
    }

    Alert.alert(
      "Remove member?",
      `Remove ${member.name} from the team?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setUpdatingMemberId(member.id);
            void (async () => {
              try {
                await removeTeamMember(member.id);
              } catch (error) {
                const message = getErrorMessage(error, "Unable to remove this team member.");
                Alert.alert("Remove failed", message);
              } finally {
                setUpdatingMemberId(null);
              }
            })();
          },
        },
      ],
    );
  };

  const canManageMemberAccess = (member: TeamMember) =>
    canManageRoles && (member.role === "Driver" || member.role === "Crew Chief");

  const handleOpenMemberAccess = (member: TeamMember) => {
    if (!canManageMemberAccess(member) || updatingMemberId) {
      return;
    }

    if (selectedAccessMemberId === member.id) {
      setSelectedAccessMemberId(null);
      setDraftPermissions(null);
      return;
    }

    setSelectedRoleMemberId(null);
    setSelectedAccessMemberId(member.id);
    setDraftPermissions(normalizeTeamMemberPermissions(member.permissions));
  };

  const togglePermission = (key: keyof TeamMemberPermissions) => {
    setDraftPermissions((current) => {
      const next = normalizeTeamMemberPermissions(current ?? undefined);
      next[key] = !next[key];
      return { ...next };
    });
  };

  const handleSaveMemberAccess = (member: TeamMember) => {
    if (!draftPermissions || updatingMemberId) {
      return;
    }

    setUpdatingMemberId(member.id);
    void (async () => {
      try {
        await updateTeamMemberPermissions(member.id, draftPermissions);
        setSelectedAccessMemberId(null);
        setDraftPermissions(null);
      } catch (error) {
        const message = getErrorMessage(error, "Unable to update this team-member access.");
        Alert.alert("Access update failed", message);
      } finally {
        setUpdatingMemberId(null);
      }
    })();
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
            <View key={member.id} style={styles.memberBlock}>
              <View style={styles.row}>
                <View style={styles.memberInfo}>
                  <Text style={styles.name}>{member.name}</Text>
                  {canManageMemberAccess(member) ? (
                    <Pressable onPress={() => handleOpenMemberAccess(member)} hitSlop={8}>
                      <Text style={styles.accessLink}>
                        {selectedAccessMemberId === member.id ? "Hide Access" : "Access"}
                      </Text>
                    </Pressable>
                  ) : null}
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
                    <>
                      <Text style={styles.roleHint}>
                        {member.id === currentOwnerId ? "Tap another member to transfer owner" : "Tap to change"}
                      </Text>
                      {member.id !== currentOwnerId ? (
                        <Pressable onPress={() => handleRemoveMember(member)} hitSlop={8}>
                          <Text style={styles.removeLink}>
                            {updatingMemberId === member.id ? "Removing..." : "Remove"}
                          </Text>
                        </Pressable>
                      ) : null}
                    </>
                  ) : null}
                </View>
              </View>
              {selectedRoleMemberId === member.id ? (
                <View style={styles.roleCard}>
                  <Text style={styles.roleCardTitle}>Change Role</Text>
                  <Text style={styles.roleCardCopy}>
                    Choose the role you want to assign to {member.name}.
                  </Text>
                  <View style={styles.roleChoicesWrap}>
                    {editableTeamRoles
                      .filter((role) => role !== member.role)
                      .map((role) => (
                        <AppPressable
                          key={`${member.id}-${role}`}
                          onPress={() => handleRoleSelection(member, role)}
                          style={styles.roleChoiceButton}
                        >
                          <Text style={styles.roleChoiceButtonText}>{role}</Text>
                        </AppPressable>
                      ))}
                  </View>
                  <Pressable onPress={() => setSelectedRoleMemberId(null)} hitSlop={8}>
                    <Text style={styles.cancelLink}>Cancel</Text>
                  </Pressable>
                </View>
              ) : null}
              {selectedAccessMemberId === member.id && draftPermissions ? (
                <View style={styles.accessCard}>
                  <Text style={styles.accessCardTitle}>{member.role} Access</Text>
                  <Text style={styles.accessCardCopy}>
                    Choose which team-wide areas {member.name} is allowed to change in the app.
                  </Text>
                  {accessOptions.map((option) => (
                    <CheckRow
                      key={`${member.id}-${option.key}`}
                      label={option.label}
                      checked={draftPermissions[option.key]}
                      onPress={() => togglePermission(option.key)}
                    />
                  ))}
                  <AppPressable
                    onPress={() => handleSaveMemberAccess(member)}
                    style={styles.saveAccessButton}
                  >
                    <Text style={styles.saveAccessButtonText}>
                      {updatingMemberId === member.id ? "Saving..." : "Save Access Changes"}
                    </Text>
                  </AppPressable>
                </View>
              ) : null}
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
  memberBlock: {
    borderTopColor: "#21486A",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing(1),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  accessLink: {
    color: "#8ED4FF",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
    textDecorationLine: "underline",
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
  removeLink: {
    color: "#8ED4FF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    textDecorationLine: "underline",
  },
  roleCard: {
    backgroundColor: "#10263B",
    borderColor: "#21486A",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: spacing(1),
    padding: spacing(1.25),
  },
  roleCardTitle: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.75,
    marginBottom: spacing(0.4),
    textAlign: "center",
    textTransform: "uppercase",
  },
  roleCardCopy: {
    color: colors.subtext,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing(1),
    textAlign: "center",
  },
  roleChoicesWrap: {
    gap: spacing(0.75),
  },
  roleChoiceButton: {
    alignItems: "center",
    backgroundColor: "#153E60",
    borderColor: "#2F7DB4",
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
  },
  roleChoiceButtonText: {
    color: "#EAF7FF",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  cancelLink: {
    color: "#8ED4FF",
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing(0.9),
    textAlign: "center",
    textDecorationLine: "underline",
  },
  accessCard: {
    backgroundColor: "#10263B",
    borderColor: "#21486A",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: spacing(1),
    padding: spacing(1.25),
  },
  accessCardTitle: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.75,
    marginBottom: spacing(0.4),
    textAlign: "center",
    textTransform: "uppercase",
  },
  accessCardCopy: {
    color: colors.subtext,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing(1),
    textAlign: "center",
  },
  checkRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing(0.85),
    marginBottom: spacing(0.85),
  },
  checkbox: {
    alignItems: "center",
    backgroundColor: "#0A1A29",
    borderColor: "#356586",
    borderRadius: 10,
    borderWidth: 2,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  checkboxChecked: {
    borderColor: "#5AB3FF",
  },
  checkboxMark: {
    height: 28,
    width: 28,
  },
  checkLabel: {
    color: "#EAF7FF",
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  saveAccessButton: {
    alignItems: "center",
    backgroundColor: "#5AB3FF",
    borderRadius: 999,
    marginTop: spacing(0.5),
    paddingVertical: 12,
  },
  saveAccessButtonText: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: "900",
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

