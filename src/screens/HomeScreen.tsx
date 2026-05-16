import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { colors, spacing } from "../theme";
import { formatStoredDateValue, getDateSortValue, parseStoredDate } from "../utils/date";

const primaryQuickActions = [
  {
    label: "Account",
    icon: require("../../assets/icons/account.png"),
    target: "Account",
  },
  {
    label: "Events",
    icon: require("../../assets/icons/events.png"),
    target: "Events",
  },
  {
    label: "Setups",
    icon: require("../../assets/icons/setups.png"),
    target: "Setups",
  },
  {
    label: "Tires",
    icon: require("../../assets/icons/tires.png"),
    target: "Tires",
  },
];

const secondaryQuickActions = [
  {
    label: "Gears",
    icon: require("../../assets/icons/gears.png"),
    target: "Gears",
  },
  {
    label: "Shocks",
    icon: require("../../assets/icons/shocks.png"),
    target: "Shocks",
  },
  {
    label: "Settings",
    icon: require("../../assets/icons/settings.png"),
    target: "Settings",
  },
  {
    label: "Tracks",
    icon: require("../../assets/icons/tracks.png"),
    target: "Tracks",
  },
];

export default function HomeScreen({ navigation }: any) {
  const scrollRef = useRef<ScrollView>(null);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const teamName = useAppStore((state) => state.teamName);
  const racingType = useAppStore((state) => state.racingType);
  const raceCarType = useAppStore((state) => state.raceCarType);
  const carClass = useAppStore((state) => state.carClass);
  const teamMembers = useAppStore((state) => state.teamMembers);
  const raceEvents = useAppStore((state) => state.raceEvents);
  const raceNights = useAppStore((state) => state.raceNights);
  const deleteRaceNight = useAppStore((state) => state.deleteRaceNight);
  const getActiveRaceNightIdForEvent = useAppStore((state) => state.getActiveRaceNightIdForEvent);

  useFocusEffect(
    React.useCallback(() => {
      setShowMoreActions(false);

      const timeout = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }, 0);

      return () => clearTimeout(timeout);
    }, []),
  );

  const normalizedToday = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  }, []);

  const activeRaceNight = useMemo(
    () =>
      [...raceNights]
        .filter((night) => night.status === "active")
        .sort((a, b) => {
          const dateSort = getDateSortValue(b.eventDate) - getDateSortValue(a.eventDate);
          if (dateSort !== 0) {
            return dateSort;
          }

          return b.createdAt.localeCompare(a.createdAt);
        })[0],
    [raceNights],
  );

  const upcomingEvent = useMemo(() => {
    const sortedEvents = [...raceEvents].sort(
      (a, b) => getDateSortValue(a.eventDate) - getDateSortValue(b.eventDate),
    );

    const todayEvent = sortedEvents.find(
      (event) => parseStoredDate(event.eventDate).setHours(0, 0, 0, 0) === normalizedToday,
    );
    if (todayEvent) {
      return todayEvent;
    }

    return sortedEvents.find(
      (event) => parseStoredDate(event.eventDate).setHours(0, 0, 0, 0) > normalizedToday,
    );
  }, [normalizedToday, raceEvents]);

  const latestCompletedNight = useMemo(
    () =>
      [...raceNights]
        .filter((night) => night.status === "completed")
        .sort((a, b) => {
          const dateSort = getDateSortValue(b.eventDate) - getDateSortValue(a.eventDate);
          if (dateSort !== 0) {
            return dateSort;
          }

          return b.createdAt.localeCompare(a.createdAt);
        })[0],
    [raceNights],
  );

  const mostRacedTrack = useMemo(() => {
    const usageMap = new Map<string, number>();
    raceNights.forEach((night) => {
      const trackName = night.trackName.trim();
      if (!trackName) {
        return;
      }

      usageMap.set(trackName, (usageMap.get(trackName) ?? 0) + 1);
    });

    return [...usageMap.entries()].sort((a, b) => b[1] - a[1])[0];
  }, [raceNights]);

  const handlePrimaryAction = () => {
    if (activeRaceNight) {
      navigation.getParent()?.push("RaceNight", { raceNightId: activeRaceNight.id });
      return;
    }

    if (upcomingEvent) {
      const activeRaceNightId = getActiveRaceNightIdForEvent(upcomingEvent.id);
      if (activeRaceNightId) {
        navigation.getParent()?.push("RaceNight", { raceNightId: activeRaceNightId });
        return;
      }

      navigation.getParent()?.push("EventDetail", { eventId: upcomingEvent.id });
      return;
    }

    navigation.navigate("Events");
  };

  const handleNewRaceAction = () => {
    navigation.navigate("Events", { showAddEvent: true });
  };

  const handleDeleteActiveRaceNight = () => {
    if (!activeRaceNight) {
      return;
    }

    Alert.alert(
      "Delete Race Night?",
      `Delete the active race night for ${activeRaceNight.eventTitle}? This removes the saved race-night notes for that session.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteRaceNight(activeRaceNight.id);
          },
        },
      ],
    );
  };

  const upcomingCountdown = useMemo(() => {
    const countdownSource = activeRaceNight ?? upcomingEvent;
    if (!countdownSource) {
      return undefined;
    }

    const eventDate = parseStoredDate(countdownSource.eventDate);
    const today = new Date();
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const normalizedEventDate = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate(),
    );
    const diffMs = normalizedEventDate.getTime() - normalizedToday.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return "Race day is here";
    }

    if (diffDays === 1) {
      return "1 day until race day";
    }

    return `${diffDays} days until race day`;
  }, [activeRaceNight, upcomingEvent]);

  const isUpcomingRaceReadyToOpen = useMemo(() => {
    if (activeRaceNight || !upcomingEvent) {
      return false;
    }

    const eventDate = parseStoredDate(upcomingEvent.eventDate);
    const today = new Date();
    const normalizedTodayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const normalizedEventDate = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate(),
    );
    const diffMs = normalizedEventDate.getTime() - normalizedTodayDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    return diffDays <= 1;
  }, [activeRaceNight, upcomingEvent]);

  const handleQuickActionPress = (target: string) => {
    if (target === "Tracks") {
      navigation.getParent()?.navigate("Tracks");
      return;
    }

    navigation.navigate(target);
  };

  return (
    <LinearGradient colors={["#07111A", "#09233A", "#07111A"]} style={styles.background}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
        >
          <View>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Race Day Dashboard</Text>
            <Text style={styles.teamName}>{teamName || "Precision Pit"}</Text>
            <Text style={styles.headerCopy}>
              Open the next event quickly, keep the team aligned, and jump back into the latest
              race-night notes without digging through the app.
            </Text>
          </View>

          <View>
            <LinearGradient
              colors={["rgba(17,74,119,0.98)", "rgba(7,24,40,0.98)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View>
                <Text style={styles.heroLabel}>
                  {activeRaceNight
                    ? "Current Race Night"
                    : upcomingEvent
                      ? "Upcoming Race Night"
                      : "Race Queue"}
                </Text>
                <Text style={styles.heroTitle}>
                  {activeRaceNight?.eventTitle || upcomingEvent?.title || "No Races Scheduled"}
                </Text>
              </View>
              <Text style={styles.heroMeta}>
                {activeRaceNight
                  ? `${activeRaceNight.trackName} | ${formatStoredDateValue(activeRaceNight.eventDate)}`
                  : upcomingEvent
                    ? `${upcomingEvent.trackName} | ${formatStoredDateValue(upcomingEvent.eventDate)}`
                    : "There are no race nights on the schedule right now."}
              </Text>
              {upcomingCountdown ? <Text style={styles.countdownText}>{upcomingCountdown}</Text> : null}
              <Text style={styles.heroSupport}>
                {activeRaceNight
                  ? "Continue weather, track-condition, lineup, and note updates for the current race night."
                  : upcomingEvent
                    ? "Keep the team focused on the one event that matters next instead of scanning a long schedule."
                    : "Once the next race is on the calendar, this card becomes the fastest way into the night."}
              </Text>
                <View style={styles.heroActionRow}>
                  <Pressable onPress={handlePrimaryAction} style={styles.heroButton}>
                    <Text style={styles.heroButtonText}>
                      {activeRaceNight
                        ? "Continue Race Night"
                        : upcomingEvent
                          ? isUpcomingRaceReadyToOpen
                            ? "Open Race"
                            : "Open Event"
                          : "New Race"}
                    </Text>
                  </Pressable>
                {activeRaceNight || upcomingEvent ? (
                  <Pressable onPress={handleNewRaceAction} style={styles.heroSecondaryButton}>
                    <Text style={styles.heroSecondaryButtonText}>New Race</Text>
                  </Pressable>
                ) : null}
                {activeRaceNight ? (
                  <Pressable onPress={handleDeleteActiveRaceNight} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>X</Text>
                  </Pressable>
                ) : null}
              </View>
            </LinearGradient>
          </View>

          <View style={styles.twoColumnRow}>
            <View style={styles.infoCard}>
              <View>
                <Text style={styles.cardEyebrow}>Team Snapshot</Text>
              </View>
              <InfoRow label="Track Type" value={racingType || "Not set"} />
              <InfoRow label="Racing Type" value={raceCarType || "Not set"} />
              <InfoRow label="Car Class" value={carClass || "Not set"} />
              <InfoRow label="Members" value={`${teamMembers.length || 1}`} />
              <InfoRow
                label="Most Raced"
                value={mostRacedTrack ? `${mostRacedTrack[0]} (${mostRacedTrack[1]})` : "No history yet"}
              />
            </View>

            <View style={[styles.infoCard, styles.resultCard]}>
              <View>
                <Text style={styles.cardEyebrow}>Recent Result</Text>
              </View>
              <Text style={styles.resultTitle}>
                {latestCompletedNight?.eventTitle || "No completed race yet"}
              </Text>
              <Text style={styles.resultMeta}>
                {latestCompletedNight
                  ? `${latestCompletedNight.trackName} | ${formatStoredDateValue(latestCompletedNight.eventDate)}`
                  : "Your most recent completed night will show here."}
              </Text>
              <Text style={styles.resultFinish}>
                {latestCompletedNight?.featureFinishPosition
                  ? `Feature finish: P${latestCompletedNight.featureFinishPosition}`
                  : "Feature finish: -"}
              </Text>
              <Pressable
                onPress={() => navigation.getParent()?.navigate("PastRaces")}
                style={styles.resultButton}
              >
                <Text style={styles.resultButtonText}>Open Past Races</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.quickActionsCard}>
            <View style={styles.quickActionsHeader}>
              <View>
                <Text style={styles.cardEyebrow}>Quick Actions</Text>
              </View>
              <Pressable onPress={() => setShowMoreActions((current) => !current)}>
                <Text style={styles.secondaryLink}>{showMoreActions ? "Less..." : "More..."}</Text>
              </Pressable>
            </View>
            <View style={styles.quickActionsGrid}>
              {primaryQuickActions.map((action) => (
                <Pressable
                  key={action.label}
                  onPress={() => handleQuickActionPress(action.target)}
                  style={styles.quickAction}
                >
                  <Image source={action.icon} style={styles.quickActionIcon} resizeMode="contain" />
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
            {showMoreActions ? (
              <View style={styles.quickActionsGridSecondary}>
                {secondaryQuickActions.map((action) => (
                  <Pressable
                    key={action.label}
                    onPress={() => handleQuickActionPress(action.target)}
                    style={styles.quickActionSecondary}
                  >
                    <Image
                      source={action.icon}
                      style={styles.quickActionIconSecondary}
                      resizeMode="contain"
                    />
                    <Text style={styles.quickActionLabel}>{action.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View>
            <Pressable
              onPress={() => navigation.getParent()?.navigate("PreviousTracks")}
              style={styles.trackHistoryCard}
            >
              <Image
                source={require("../../assets/icons/tracks.png")}
                style={styles.trackHistoryIcon}
                resizeMode="contain"
              />
              <View style={styles.trackHistoryCopy}>
                <View>
                  <Text style={styles.cardEyebrow}>Track History</Text>
                </View>
                <Text style={styles.trackHistoryText}>
                  Review previously raced tracks, yearly race counts, and average finish trends.
                </Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.footerLinksRow}>
            <Pressable onPress={() => navigation.getParent()?.navigate("Privacy")}>
              <Text style={styles.footerLink}>Privacy</Text>
            </Pressable>
            <Text style={styles.footerDivider}>|</Text>
            <Pressable onPress={() => navigation.getParent()?.navigate("Support")}>
              <Text style={styles.footerLink}>Support</Text>
            </Pressable>
          </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 24,
  },
  header: {
    marginBottom: spacing(1.5),
  },
  eyebrow: {
    color: "#6DBDFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  teamName: {
    color: "#EAF7FF",
    fontSize: 26,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 0.5,
    marginBottom: 6,
    textShadowColor: "rgba(31,111,235,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  headerCopy: {
    color: "#9FC6E4",
    fontSize: 14,
    lineHeight: 20,
  },
  heroCard: {
    borderColor: "rgba(142,212,255,0.22)",
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: spacing(1.5),
    overflow: "hidden",
    padding: spacing(1.75),
  },
  heroLabel: {
    color: "#9CD9FF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#F3FAFF",
    fontSize: 24,
    fontWeight: "900",
    fontStyle: "italic",
    marginBottom: 6,
  },
  heroMeta: {
    color: "#B9DDF6",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  heroSupport: {
    color: "#D0E7F7",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing(1.5),
  },
  countdownText: {
    color: "#6DD8A5",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  heroButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  heroButtonText: {
    color: "#F3FAFF",
    fontSize: 14,
    fontWeight: "800",
  },
  heroActionRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(1),
  },
  heroSecondaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    borderColor: "#5AB3FF",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  heroSecondaryButtonText: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "800",
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#A62626",
    borderColor: "#D9534F",
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  deleteButtonText: {
    color: "#FFF4F4",
    fontSize: 16,
    fontWeight: "900",
  },
  twoColumnRow: {
    gap: spacing(2),
    marginBottom: spacing(1.5),
  },
  infoCard: {
    backgroundColor: "rgba(10, 23, 38, 0.92)",
    borderColor: "rgba(79, 115, 144, 0.35)",
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing(1.5),
  },
  resultCard: {
    justifyContent: "space-between",
  },
  cardEyebrow: {
    color: "#8ED4FF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: spacing(1.25),
    textTransform: "uppercase",
  },
  infoRow: {
    borderTopColor: "rgba(79, 115, 144, 0.24)",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabel: {
    color: "#7FA6C0",
    fontSize: 13,
    fontWeight: "700",
  },
  infoValue: {
    color: "#E2F2FF",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: spacing(1),
    textAlign: "right",
  },
  resultTitle: {
    color: "#EAF7FF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  resultMeta: {
    color: "#9FC6E4",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  resultFinish: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
  },
  resultButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    marginTop: spacing(1),
    minWidth: 156,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultButtonText: {
    color: "#F3FAFF",
    fontSize: 14,
    fontWeight: "800",
  },
  quickActionsCard: {
    backgroundColor: "rgba(10, 23, 38, 0.92)",
    borderColor: "rgba(79, 115, 144, 0.35)",
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing(1.5),
  },
  quickActionsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing(1.25),
  },
  secondaryLink: {
    color: "#5AB3FF",
    fontSize: 13,
    fontWeight: "700",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing(1),
  },
  quickActionsGridSecondary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(1.5),
    justifyContent: "space-between",
    marginTop: spacing(1.5),
  },
  quickAction: {
    alignItems: "center",
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing(0.75),
    paddingVertical: spacing(1),
    width: "48%",
  },
  quickActionSecondary: {
    alignItems: "center",
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing(1),
    paddingVertical: spacing(1.25),
    width: "47%",
  },
  quickActionIcon: {
    height: 96,
    marginBottom: 8,
    width: 96,
  },
  quickActionIconSecondary: {
    height: 90,
    marginBottom: 8,
    width: 90,
  },
  quickActionLabel: {
    color: "#EAF7FF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  trackHistoryCard: {
    alignItems: "center",
    backgroundColor: "rgba(10, 23, 38, 0.92)",
    borderColor: "rgba(79, 115, 144, 0.35)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: spacing(1.5),
    padding: spacing(1.5),
  },
  trackHistoryIcon: {
    height: 72,
    marginRight: spacing(1.5),
    width: 72,
  },
  trackHistoryCopy: {
    flex: 1,
  },
  trackHistoryText: {
    color: "#9FC6E4",
    fontSize: 13,
    lineHeight: 18,
  },
  footerLinksRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: spacing(0.5),
    marginTop: spacing(1.5),
  },
  footerLink: {
    color: "#9CD9FF",
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 8,
    textDecorationLine: "underline",
  },
  footerDivider: {
    color: "#5E89AA",
    fontSize: 13,
    fontWeight: "700",
  },
});

