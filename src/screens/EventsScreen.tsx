import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, Keyboard, Pressable, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from "react-native";
import TextInput from "../components/AppTextInput";
import KeyboardScreen from "../components/KeyboardScreen";
import DatePickerModal from "../components/DatePickerModal";
import { dirtOvalTracks } from "../data/dirtOvalTracks";
import { usesDirtOvalTrackLibrary } from "../data/racing";
import { useAppStore } from "../store/useAppStore";
import { colors, spacing } from "../theme";
import { formatStoredDateValue, getDateSortValue, parseStoredDate } from "../utils/date";

export default function EventsScreen({ navigation, route }: any) {
  const raceEvents = useAppStore((state) => state.raceEvents);
  const raceNights = useAppStore((state) => state.raceNights);
  const racingType = useAppStore((state) => state.racingType);
  const teamId = useAppStore((state) => state.teamId);
  const createRaceEvent = useAppStore((state) => state.createRaceEvent);
  const deleteRaceEvent = useAppStore((state) => state.deleteRaceEvent);
  const startRaceNight = useAppStore((state) => state.startRaceNight);
  const getActiveRaceNightIdForEvent = useAppStore((state) => state.getActiveRaceNightIdForEvent);
  const [title, setTitle] = useState("");
  const [trackName, setTrackName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTrackMenu, setShowTrackMenu] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [dismissedPopularTrack, setDismissedPopularTrack] = useState(false);

  const sortedEvents = useMemo(
    () => [...raceEvents].sort((a, b) => getDateSortValue(a.eventDate) - getDateSortValue(b.eventDate)),
    [raceEvents],
  );

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    return sortedEvents.filter(
      (event) => parseStoredDate(event.eventDate).setHours(0, 0, 0, 0) >= normalizedToday,
    );
  }, [sortedEvents]);

  const visibleUpcomingEvents = useMemo(
    () => (showAllEvents ? upcomingEvents : upcomingEvents.slice(0, 3)),
    [showAllEvents, upcomingEvents],
  );

  const scheduledDateValues = useMemo(
    () => sortedEvents.map((event) => formatStoredDateValue(event.eventDate)),
    [sortedEvents],
  );

  const popularTrack = useMemo(() => {
    const usageMap = new Map<string, number>();

    [...raceEvents.map((event) => event.trackName), ...raceNights.map((night) => night.trackName)].forEach(
      (track) => {
        const normalizedTrack = track.trim();
        if (!normalizedTrack) {
          return;
        }

        usageMap.set(normalizedTrack, (usageMap.get(normalizedTrack) ?? 0) + 1);
      },
    );

    return [...usageMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  }, [raceEvents, raceNights]);

  const hasRaceHistory = raceEvents.length > 0 || raceNights.length > 0;

  const availableTracks = useMemo(() => {
    if (!usesDirtOvalTrackLibrary(racingType)) {
      return [];
    }

    return dirtOvalTracks;
  }, [racingType]);

  const filteredTracks = useMemo(() => {
    if (!availableTracks.length) {
      return [];
    }

    const search = trackName.trim().toLowerCase();
    if (!search) {
      return availableTracks;
    }

    return availableTracks.filter((track) =>
      [track.name, track.city, track.state].some((value) => value.toLowerCase().includes(search)),
    );
  }, [availableTracks, trackName]);

  useEffect(() => {
    setTitle("");
    setTrackName("");
    setEventDate("");
    setShowTrackMenu(false);
    setDismissedPopularTrack(false);
  }, [teamId]);

  useEffect(() => {
    if (!showAddEvent) {
      return;
    }

    if (!hasRaceHistory) {
      return;
    }

    if (!dismissedPopularTrack && !trackName.trim() && popularTrack) {
      setTrackName(popularTrack);
    }
  }, [dismissedPopularTrack, hasRaceHistory, popularTrack, showAddEvent, trackName]);

  useEffect(() => {
    if (route.params?.showAddEvent) {
      setShowAddEvent(true);
      navigation.setParams?.({ showAddEvent: undefined });
    }
  }, [navigation, route.params?.showAddEvent]);

  const getRaceNightsForEvent = (eventId: string, titleText: string, trackText: string, dateValue: string) => {
    const normalizedTitle = titleText.trim().toLowerCase();
    const normalizedTrack = trackText.trim().toLowerCase();
    const normalizedDate = formatStoredDateValue(dateValue);

    return [...raceNights]
      .map((night) => {
        if (night.eventId === eventId) {
          return { night, matchScore: 100 };
        }

        const sameDate = formatStoredDateValue(night.eventDate) === normalizedDate;
        const sameTrack = night.trackName.trim().toLowerCase() === normalizedTrack;
        const sameTitle = night.eventTitle.trim().toLowerCase() === normalizedTitle;

        let matchScore = 0;
        if (sameDate && sameTrack && sameTitle) {
          matchScore = 90;
        } else if (sameDate && sameTrack) {
          matchScore = 80;
        } else if (sameDate && sameTitle) {
          matchScore = 70;
        } else if (sameDate) {
          matchScore = 50;
        }

        return { night, matchScore };
      })
      .filter(({ matchScore }) => matchScore > 0)
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }

        return b.night.createdAt.localeCompare(a.night.createdAt);
      })
      .map(({ night }) => night);
  };

  const handleCreateEvent = async () => {
    if (!title.trim() || !trackName.trim() || !eventDate.trim()) {
      Alert.alert("Missing information", "Enter an event name, track name, and date.");
      return;
    }

    try {
      await createRaceEvent({ title, trackName, eventDate });
      setTitle("");
      setTrackName("");
      setEventDate("");
      setShowTrackMenu(false);
      setShowAddEvent(false);
      setDismissedPopularTrack(false);
      Alert.alert("Saved", "The event was added to the team schedule.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create the event.";
      Alert.alert("Save failed", message);
    }
  };

  const handleDeleteEvent = (eventId: string, titleText: string) => {
    Alert.alert(
      "Delete Scheduled Race?",
      `Remove ${titleText} from the schedule?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await deleteRaceEvent(eventId);
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : "Unable to delete the scheduled race.";
                Alert.alert("Delete failed", message);
              }
            })();
          },
        },
      ],
    );
  };

  const handleOpenEvent = async (eventId: string, titleText: string, trackText: string, dateValue: string) => {
    const openSelectedEvent = async (options?: {
      allowWithOtherActive?: boolean;
      completeOtherActive?: boolean;
    }) => {
      try {
        const latestRaceNightId = getRaceNightsForEvent(eventId, titleText, trackText, dateValue)[0]?.id;
        const raceNightId =
          getActiveRaceNightIdForEvent(eventId) ??
          latestRaceNightId ??
          (await startRaceNight(eventId, options));
        const parentNavigation = navigation.getParent?.();
        if (parentNavigation?.push) {
          parentNavigation.push("RaceNight", { raceNightId });
          return;
        }

        parentNavigation?.navigate("RaceNight", { raceNightId });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to open the event.";
        Alert.alert("Unable to open race", message);
      }
    };

    const otherActiveRaceNight = raceNights.find(
      (raceNight) => raceNight.eventId !== eventId && raceNight.status === "active",
    );

    if (otherActiveRaceNight && !getActiveRaceNightIdForEvent(eventId)) {
      Alert.alert(
        "Previous race still active",
        `Do you want to mark the ${formatStoredDateValue(otherActiveRaceNight.eventDate)} race completed first before starting this race?`,
        [
          {
            text: "No",
            onPress: () => {
              void openSelectedEvent({ allowWithOtherActive: true });
            },
          },
          {
            text: "Yes",
            onPress: () => {
              void openSelectedEvent({ completeOtherActive: true });
            },
          },
          { text: "Cancel", style: "cancel" },
        ],
      );
      return;
    }

    await openSelectedEvent();
  };

  const handleCancelAddEvent = () => {
    setTitle("");
    setTrackName("");
    setEventDate("");
    setShowTrackMenu(false);
    setDismissedPopularTrack(false);
    setShowAddEvent(false);
  };

  const renderEventRow = (
    eventId: string,
    titleText: string,
    trackText: string,
    dateValue: string,
    options?: {
      deemphasized?: boolean;
      allowDelete?: boolean;
    },
  ) => {
    const nightsForEvent = getRaceNightsForEvent(eventId, titleText, trackText, dateValue);
    const latestNight = nightsForEvent[0];
    const isDeemphasized = options?.deemphasized ?? false;
    const allowDelete = options?.allowDelete ?? false;
    const today = new Date();
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const eventTime = parseStoredDate(dateValue).setHours(0, 0, 0, 0);
    const isPastEvent = eventTime < normalizedToday;

    let statusTop = "";
    let statusBottom = "";

    if (isPastEvent && latestNight) {
      statusTop =
        latestNight.status === "rainout"
          ? "Rainout"
          : latestNight.featureFinishPosition
            ? `P${latestNight.featureFinishPosition}`
            : "";
      statusBottom = latestNight.status === "completed" || latestNight.status === "rainout" ? "Completed" : "";
    } else if (!isPastEvent) {
      statusBottom = "New Race";
    }

    return (
      <Pressable
        key={eventId}
        onPress={() => void handleOpenEvent(eventId, titleText, trackText, dateValue)}
        style={[styles.eventRow, isDeemphasized ? styles.eventRowDeemphasized : undefined]}
      >
        <View style={styles.eventCopy}>
          <View style={styles.eventTitleRow}>
            <Text style={[styles.eventName, isDeemphasized ? styles.eventTextMuted : undefined]}>
              {titleText}
            </Text>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                navigation.push("EventDetail", { eventId });
              }}
              style={styles.eventEditButton}
            >
              <Text style={styles.eventEditButtonText}>✐</Text>
            </Pressable>
          </View>
          <Text style={[styles.eventMeta, isDeemphasized ? styles.eventTextMuted : undefined]}>
            {trackText}
          </Text>
          <Text style={[styles.eventMeta, isDeemphasized ? styles.eventTextMuted : undefined]}>
            {formatStoredDateValue(dateValue)}
          </Text>
        </View>
        <View style={styles.eventStatusColumn}>
          {allowDelete ? (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                handleDeleteEvent(eventId, titleText);
              }}
              style={styles.eventDeleteButton}
            >
              <Text style={styles.eventDeleteButtonText}>X</Text>
            </Pressable>
          ) : null}
          {statusTop ? (
            <Text style={[styles.eventCount, isDeemphasized ? styles.eventCountMuted : undefined]}>
              {statusTop}
            </Text>
          ) : null}
          {statusBottom ? (
            <Text style={[styles.eventCountSubtle, isDeemphasized ? styles.eventCountMuted : undefined]}>
              {statusBottom}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <TouchableWithoutFeedback
      accessible={false}
      onPress={() => {
        Keyboard.dismiss();
        setShowTrackMenu(false);
      }}
    >
      <KeyboardScreen
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            setShowTrackMenu(false);
          }}
        >
          <Image
            source={require("../../assets/icons/events.png")}
            style={styles.bannerImage}
            resizeMode="contain"
          />
          <Text style={styles.h1}>Events</Text>
          <Text style={styles.subhead}>
            Keep the next few race dates in view, then open an event and start race night when the
            team gets to the track.
          </Text>
        </Pressable>

        <View style={styles.card}>
          <Pressable
            onPress={() => {
              setShowAddEvent((current) => {
                const nextValue = !current;
                if (nextValue) {
                  setDismissedPopularTrack(false);
                }
                return nextValue;
              });
              setShowTrackMenu(false);
            }}
            style={styles.expandButton}
          >
            <Text style={styles.expandButtonText}>{showAddEvent ? "Hide Add Event" : "Add Event"}</Text>
            <Text style={styles.fieldIcon}>{showAddEvent ? "^" : "v"}</Text>
          </Pressable>

          {showAddEvent ? (
            <>
              <Text style={styles.sectionTitle}>Add Event</Text>
              {popularTrack ? (
                <Text style={styles.helper}>Most-used track auto-filled: {popularTrack}</Text>
              ) : null}
              <TextInput
                style={styles.input}
                placeholder="Event name"
                placeholderTextColor="#4F7390"
                value={title}
                onFocus={() => setShowTrackMenu(false)}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Track</Text>
              <View style={styles.trackInputWrap}>
                <TextInput
                  style={[styles.input, styles.trackInput]}
                  placeholder="Track name"
                  placeholderTextColor="#4F7390"
                  value={trackName}
                  onFocus={() => {
                    if (availableTracks.length) {
                      setShowTrackMenu(true);
                    }
                  }}
                  onChangeText={(value) => {
                    if (!value.trim()) {
                      setDismissedPopularTrack(true);
                    }
                    setTrackName(value);
                    setShowTrackMenu(availableTracks.length > 0);
                  }}
                />
                {trackName ? (
                  <Pressable
                    onPress={() => {
                      setDismissedPopularTrack(true);
                      setTrackName("");
                      setShowTrackMenu(false);
                    }}
                    style={styles.trackClearButton}
                  >
                    <Text style={styles.trackClearButtonText}>x</Text>
                  </Pressable>
                ) : null}
              </View>

              {showTrackMenu && availableTracks.length ? (
                <View style={styles.menuCard}>
                  <ScrollView
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    style={styles.trackMenuScroll}
                  >
                    {filteredTracks.length ? (
                      filteredTracks.map((track) => (
                        <Pressable
                          key={`${track.name}-${track.state}`}
                          onPress={() => {
                            setTrackName(track.name);
                            setShowTrackMenu(false);
                          }}
                          style={styles.menuRow}
                        >
                          <View style={styles.menuCopy}>
                            <Text style={styles.menuName}>{track.name}</Text>
                            <Text style={styles.menuLocation}>
                              {track.city}, {track.state}
                            </Text>
                          </View>
                        </Pressable>
                      ))
                    ) : (
                      <Pressable
                        onPress={() => {
                          setShowTrackMenu(false);
                        }}
                        style={styles.menuRow}
                      >
                        <Text style={styles.emptyText}>No tracks matched that search.</Text>
                      </Pressable>
                    )}
                  </ScrollView>
                </View>
              ) : null}

              <Text style={styles.label}>Event Date</Text>
              <View style={styles.dateRow}>
                <Pressable
                  onPress={() => {
                    setShowTrackMenu(false);
                    setShowDatePicker(true);
                  }}
                  style={[styles.fieldButton, styles.dateFieldButton]}
                >
                  <Text style={eventDate ? styles.fieldValue : styles.fieldPlaceholder}>
                    {eventDate || "Select event date"}
                  </Text>
                  {eventDate ? (
                    <Pressable
                      onPress={() => {
                        setShowTrackMenu(false);
                        setEventDate("");
                      }}
                      style={styles.dateClearInlineButton}
                    >
                      <Text style={styles.dateClearInlineButtonText}>x</Text>
                    </Pressable>
                  ) : null}
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowTrackMenu(false);
                    setShowDatePicker(true);
                  }}
                  style={styles.dateIconButton}
                >
                  <Text style={styles.dateIconButtonText}>{"\uD83D\uDCC5"}</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => {
                  setShowTrackMenu(false);
                  void handleCreateEvent();
                }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Add To Schedule</Text>
              </Pressable>

              <Pressable onPress={handleCancelAddEvent} style={styles.secondaryButtonCompact}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Upcoming Races</Text>
            <Pressable onPress={() => setShowAllEvents((current) => !current)}>
              <Text style={styles.inlineLinkText}>
                {showAllEvents ? "Hide All" : "See All"}
              </Text>
            </Pressable>
          </View>

          {visibleUpcomingEvents.length ? (
            visibleUpcomingEvents.map((event) =>
              renderEventRow(event.id, event.title, event.trackName, event.eventDate, {
                deemphasized: false,
                allowDelete: true,
              }),
            )
          ) : (
            <Text style={styles.emptyText}>No scheduled race events yet.</Text>
          )}
        </View>

        <Pressable
          onPress={() => {
            setShowTrackMenu(false);
            navigation.getParent()?.navigate("PastRaces");
          }}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Past Races</Text>
        </Pressable>

        <DatePickerModal
          visible={showDatePicker}
          initialDate={eventDate}
          scheduledDates={scheduledDateValues}
          onClose={() => setShowDatePicker(false)}
          onSelectDate={setEventDate}
        />
      </KeyboardScreen>
    </TouchableWithoutFeedback>
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
  bannerImage: {
    alignSelf: "center",
    height: 250,
    marginBottom: spacing(0.25),
    marginTop: spacing(2),
    width: 250,
  },
  h1: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: spacing(1),
    textAlign: "center",
  },
  subhead: {
    color: colors.subtext,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing(2),
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing(2),
    marginBottom: spacing(2),
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing(0.5),
  },
  sectionTitle: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing(1.5),
  },
  helper: {
    color: "#87AFCB",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing(1),
  },
  expandButton: {
    alignItems: "center",
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing(1.25),
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  expandButtonText: {
    color: "#EAF7FF",
    fontSize: 17,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#0E223B",
    borderWidth: 1,
    borderColor: "#21486A",
    color: "#EAF7FF",
    fontSize: 17,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: spacing(1.5),
  },
  trackInputWrap: {
    position: "relative",
  },
  trackInput: {
    paddingRight: 48,
  },
  trackClearButton: {
    alignItems: "center",
    height: 34,
    justifyContent: "center",
    position: "absolute",
    right: 10,
    top: 10,
    width: 34,
  },
  trackClearButtonText: {
    color: "#87AFCB",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 20,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: spacing(0.75),
  },
  fieldButton: {
    backgroundColor: "#0E223B",
    borderWidth: 1,
    borderColor: "#21486A",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: spacing(1.5),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownButtonDisabled: {
    opacity: 0.65,
  },
  fieldValue: {
    color: "#EAF7FF",
    fontSize: 17,
    fontWeight: "700",
  },
  fieldPlaceholder: {
    color: "#4F7390",
    fontSize: 17,
  },
  fieldIcon: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "800",
  },
  menuCard: {
    backgroundColor: "#0E223B",
    borderWidth: 1,
    borderColor: "#21486A",
    borderRadius: 16,
    marginTop: -6,
    marginBottom: spacing(1.5),
    overflow: "hidden",
  },
  trackMenuScroll: {
    maxHeight: 240,
  },
  menuRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(33,72,106,0.55)",
  },
  menuCopy: {
    flex: 1,
  },
  menuName: {
    color: "#EAF7FF",
    fontSize: 15,
    fontWeight: "700",
  },
  menuLocation: {
    color: "#87AFCB",
    fontSize: 13,
    marginTop: 4,
  },
  dateRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing(0.75),
    marginBottom: spacing(1.5),
  },
  dateFieldButton: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  dateIconButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  dateIconButtonText: {
    color: "#8ED4FF",
    fontSize: 22,
  },
  dateClearInlineButton: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
    marginLeft: spacing(1),
    minHeight: 30,
    minWidth: 30,
  },
  dateClearInlineButtonText: {
    color: "#87AFCB",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: "#F3FAFF",
    fontSize: 17,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#21486A",
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: spacing(2),
    paddingVertical: 14,
  },
  secondaryButtonCompact: {
    alignItems: "center",
    borderColor: "#21486A",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: spacing(1.25),
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#8ED4FF",
    fontSize: 16,
    fontWeight: "700",
  },
  inlineLinkText: {
    color: "#5AB3FF",
    fontSize: 13,
    fontWeight: "700",
  },
  eventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing(1.25),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#21486A",
  },
  eventRowDeemphasized: {
    opacity: 0.58,
  },
  eventCopy: {
    flex: 1,
    paddingRight: spacing(1),
  },
  eventTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing(0.75),
  },
  eventName: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  eventEditButton: {
    alignItems: "center",
    borderColor: "#21486A",
    borderRadius: 999,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    marginBottom: 4,
    width: 24,
  },
  eventEditButtonText: {
    color: "#8ED4FF",
    fontSize: 11,
    fontWeight: "800",
    transform: [{ rotate: "180deg" }],
  },
  eventDeleteButton: {
    alignItems: "center",
    backgroundColor: "#A62626",
    borderColor: "#D9534F",
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    marginBottom: 6,
    width: 40,
  },
  eventDeleteButtonText: {
    color: "#FFF4F4",
    fontSize: 16,
    fontWeight: "900",
  },
  eventMeta: {
    color: colors.subtext,
    fontSize: 14,
  },
  eventTextMuted: {
    color: "#8AA0B4",
  },
  eventCount: {
    color: "#5AB3FF",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  eventCountSubtle: {
    color: "#87AFCB",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  eventCountMuted: {
    color: "#8AA0B4",
  },
  eventStatusColumn: {
    alignItems: "flex-end",
    minWidth: 74,
  },
  emptyText: {
    color: colors.subtext,
    fontSize: 15,
  },
});


