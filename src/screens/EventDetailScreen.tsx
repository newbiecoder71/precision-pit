import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput as RNTextInput, View } from "react-native";
import TextInput from "../components/AppTextInput";
import { colors, spacing } from "../theme";
import { useAppStore } from "../store/useAppStore";

export default function EventDetailScreen({ navigation, route }: any) {
  const eventId = route.params?.eventId as string;
  const raceEvents = useAppStore((state) => state.raceEvents);
  const raceNights = useAppStore((state) => state.raceNights);
  const startRaceNight = useAppStore((state) => state.startRaceNight);
  const updateRaceEventTitle = useAppStore((state) => state.updateRaceEventTitle);
  const [editedTitle, setEditedTitle] = useState("");
  const titleInputRef = useRef<RNTextInput>(null);

  const event = raceEvents.find((entry) => entry.id === eventId);
  const eventRaceNights = useMemo(
    () =>
      raceNights
        .filter((raceNight) => raceNight.eventId === eventId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [eventId, raceNights],
  );

  useEffect(() => {
    setEditedTitle(event?.title ?? "");
  }, [eventId]);

  const handleStartRaceNight = async () => {
    try {
      const raceNightId = await startRaceNight(eventId);
      navigation.navigate("RaceNight", { raceNightId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start the race night.";
      Alert.alert("Start failed", message);
    }
  };

  const handleSaveTitle = async () => {
    try {
      titleInputRef.current?.blur();
      Keyboard.dismiss();
      await updateRaceEventTitle(eventId, editedTitle);
      Alert.alert("Saved", "The race title was updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update the race title.";
      Alert.alert("Save failed", message);
    }
  };

  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.h1}>Event not found</Text>
        <Text style={styles.subhead}>The selected event could not be loaded.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Text style={styles.h1}>{event.title}</Text>
      <Text style={styles.subhead}>
        {event.trackName} | {event.eventDate}
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Edit Race Title</Text>
        <TextInput
          ref={titleInputRef}
          value={editedTitle}
          onChangeText={setEditedTitle}
          placeholder="Race title"
          placeholderTextColor="#4F7390"
          style={styles.input}
        />
        <Pressable onPress={() => void handleSaveTitle()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Save Title</Text>
        </Pressable>
      </View>

      <Pressable onPress={handleStartRaceNight} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Start New Race Night</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Race Night History</Text>
        {eventRaceNights.length ? (
          eventRaceNights.map((raceNight) => (
            <Pressable
              key={raceNight.id}
              onPress={() => navigation.navigate("RaceNight", { raceNightId: raceNight.id })}
              style={styles.historyRow}
            >
              <View style={styles.historyCopy}>
                <Text style={styles.historyName}>{raceNight.createdAt.slice(0, 10)}</Text>
                <Text style={styles.historyMeta}>
                  Heat start {raceNight.heatStartPosition || "-"} | Heat finish{" "}
                  {raceNight.heatFinishPosition || "-"}
                </Text>
                <Text style={styles.historyMeta}>
                  Feature finish {raceNight.featureFinishPosition || "-"}
                </Text>
              </View>
              <Text
                style={[
                  styles.statusTag,
                  raceNight.status === "completed" ? styles.statusDone : styles.statusLive,
                ]}
              >
                {raceNight.status === "completed" ? "Completed" : "Active"}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyText}>No race nights saved for this event yet.</Text>
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
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
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
    paddingVertical: 15,
    marginBottom: spacing(2),
  },
  primaryButtonText: {
    color: "#F3FAFF",
    fontSize: 17,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "#21486A",
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 13,
  },
  secondaryButtonText: {
    color: "#8ED4FF",
    fontSize: 16,
    fontWeight: "800",
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing(2),
    marginBottom: spacing(2),
  },
  input: {
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 16,
    borderWidth: 1,
    color: "#EAF7FF",
    fontSize: 16,
    marginBottom: spacing(1.25),
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  sectionTitle: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing(1.5),
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing(1.25),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#21486A",
  },
  historyCopy: {
    flex: 1,
    paddingRight: spacing(1),
  },
  historyName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  historyMeta: {
    color: colors.subtext,
    fontSize: 14,
  },
  statusTag: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusDone: {
    color: "#5AD08A",
  },
  statusLive: {
    color: "#F4C15D",
  },
  emptyText: {
    color: colors.subtext,
    fontSize: 15,
  },
});

