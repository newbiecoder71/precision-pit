import React, { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAppStore } from "../store/useAppStore";
import { colors, spacing } from "../theme";
import { formatStoredDateValue, getDateSortValue, parseStoredDate } from "../utils/date";

function formatOrdinalPosition(value: string) {
  const numericValue = Number.parseInt(value.trim(), 10);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "";
  }

  const mod100 = numericValue % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${numericValue}th`;
  }

  switch (numericValue % 10) {
    case 1:
      return `${numericValue}st`;
    case 2:
      return `${numericValue}nd`;
    case 3:
      return `${numericValue}rd`;
    default:
      return `${numericValue}th`;
  }
}

export default function PastRacesScreen({ navigation }: any) {
  const scrollRef = React.useRef<ScrollView>(null);
  const raceNights = useAppStore((state) => state.raceNights);
  const saveRaceNight = useAppStore((state) => state.saveRaceNight);
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }, []);

  const pastRaceNights = useMemo(
    () =>
      [...raceNights]
        .filter((night) => {
          const eventTime = parseStoredDate(night.eventDate).setHours(0, 0, 0, 0);
          return eventTime < today || night.status === "completed" || night.status === "rainout";
        })
        .sort((a, b) => {
          const dateSort = getDateSortValue(b.eventDate) - getDateSortValue(a.eventDate);
          if (dateSort !== 0) {
            return dateSort;
          }

          return b.createdAt.localeCompare(a.createdAt);
        }),
    [raceNights, today],
  );

  useFocusEffect(
    React.useCallback(() => {
      const timeout = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }, 0);

      return () => clearTimeout(timeout);
    }, []),
  );

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Past Races</Text>
      <Text style={styles.subhead}>
        Reopen any saved race night to review the details from prior race nights.
      </Text>

      <View style={styles.card}>
        {pastRaceNights.length ? (
          pastRaceNights.map((night) => {
            const eventTime = parseStoredDate(night.eventDate).setHours(0, 0, 0, 0);
            const isPastDate = eventTime < today;
            const hasRainoutMarker = night.status === "rainout" || Boolean(night.rainoutStage);
            const isRainout = night.status !== "completed" && hasRainoutMarker;
            const hasRecordedResult =
              Boolean(night.featureFinishPosition.trim()) ||
              Boolean(night.heatFinishPosition.trim()) ||
              Boolean(night.featureStartPosition.trim());
            const isEffectivelyCompleted =
              !isRainout &&
              (night.status === "completed" || (night.status === "active" && isPastDate && hasRecordedResult));
            const topStatusLabel =
              isRainout
                ? "Rainout"
                : isEffectivelyCompleted
                  ? "Completed"
                  : isPastDate
                    ? "Saved"
                    : "Active";
            const finishLabel =
              night.status === "completed" && hasRainoutMarker
                ? "Rainout"
                : isRainout
                ? "Finished: Rainout"
                : night.featureFinishPosition.trim()
                  ? `Finished: ${formatOrdinalPosition(night.featureFinishPosition) || night.featureFinishPosition}`
                  : "Finished: -";

            return (
              <Pressable
                key={night.id}
                onPress={() => navigation.push("RaceNight", { raceNightId: night.id })}
                style={styles.row}
              >
                <View style={styles.copy}>
                  <Text style={styles.title}>{night.eventTitle}</Text>
                  <Text style={styles.meta}>{night.trackName}</Text>
                  <Text style={styles.meta}>{formatStoredDateValue(night.eventDate)}</Text>
                </View>
                <View style={styles.statusColumn}>
                  {isEffectivelyCompleted && !isRainout ? (
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        navigation.push("RaceNightPrint", { raceNightId: night.id });
                      }}
                      style={styles.printButton}
                    >
                      <Text style={styles.printButtonText}>PRINT</Text>
                    </Pressable>
                  ) : null}
                  {!isEffectivelyCompleted ? (
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        Alert.alert(
                          "Complete Race Night?",
                          "This will mark the selected race night as completed.",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Yes",
                              onPress: () => {
                                void saveRaceNight(night.id, { status: "completed" });
                              },
                            },
                          ],
                        );
                      }}
                      style={styles.completeButton}
                    >
                      <Text style={styles.completeButtonText}>COMPLETE</Text>
                    </Pressable>
                  ) : null}
                  <Text
                    style={[
                      styles.statusTag,
                      topStatusLabel === "Rainout"
                        ? styles.statusRainout
                        : topStatusLabel === "Completed"
                          ? styles.statusDone
                          : styles.statusLive,
                    ]}
                  >
                    {topStatusLabel}
                  </Text>
                  <Text style={styles.finishTag}>{finishLabel}</Text>
                </View>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No race nights saved yet.</Text>
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
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: spacing(2),
  },
  row: {
    alignItems: "center",
    borderTopColor: "#21486A",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing(1.5),
  },
  copy: {
    flex: 1,
    paddingRight: spacing(1),
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  meta: {
    color: colors.subtext,
    fontSize: 14,
  },
  statusColumn: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusTag: {
    fontSize: 13,
    fontWeight: "700",
  },
  statusDone: {
    color: "#5AD08A",
  },
  statusLive: {
    color: "#F4C15D",
  },
  statusRainout: {
    color: "#F48B6A",
  },
  finishTag: {
    color: "#8ED4FF",
    fontSize: 13,
    fontWeight: "700",
  },
  completeButton: {
    alignItems: "center",
    backgroundColor: "#2FA75A",
    borderRadius: 999,
    minWidth: 104,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  completeButtonText: {
    color: "#F6FFF8",
    fontSize: 12,
    fontWeight: "800",
  },
  printButton: {
    alignItems: "center",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    minWidth: 104,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  printButtonText: {
    color: "#F3FAFF",
    fontSize: 12,
    fontWeight: "800",
  },
  emptyText: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: spacing(1.5),
  },
});

