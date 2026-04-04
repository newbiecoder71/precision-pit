import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAppStore } from "../store/useAppStore";
import { colors, spacing } from "../theme";
import { parseStoredDate } from "../utils/date";

type TrackSummary = {
  trackName: string;
  yearlyStats: {
    year: number;
    races: number;
    wins: number;
    top5s: number;
    top10s: number;
  }[];
};

function formatFinishBuckets(wins: number, top5s: number, top10s: number) {
  const parts: string[] = [];

  if (wins > 0) {
    parts.push(`Wins: ${wins}`);
  }

  if (top5s > 0) {
    parts.push(`T5s: ${top5s}`);
  }

  if (top10s > 0) {
    parts.push(`T10s: ${top10s}`);
  }

  return parts.length ? parts.join("  |  ") : "No top-10 finish data yet";
}

export default function PreviousTracksScreen() {
  const raceEvents = useAppStore((state) => state.raceEvents);
  const raceNights = useAppStore((state) => state.raceNights);
  const savedTracks = useAppStore((state) => state.savedTracks);

  const knownTrackNames = useMemo(() => {
    const names = new Set<string>();

    raceEvents.forEach((event) => {
      const trackName = event.trackName.trim();
      if (trackName) {
        names.add(trackName);
      }
    });

    raceNights.forEach((night) => {
      const trackName = night.trackName.trim();
      if (trackName) {
        names.add(trackName);
      }
    });

    savedTracks.forEach((track) => {
      const trackName = track.name.trim();
      if (trackName) {
        names.add(trackName);
      }
    });

    return [...names].sort((a, b) => a.localeCompare(b));
  }, [raceEvents, raceNights, savedTracks]);

  const trackSummaries = useMemo(() => {
    const trackMap = new Map<
      string,
      Map<
        number,
        {
          races: number;
          wins: number;
          top5s: number;
          top10s: number;
          raceKeys: Set<string>;
        }
      >
    >();

    const ensureEntry = (trackName: string, year: number) => {
      const yearMap = trackMap.get(trackName) ?? new Map();
      const currentEntry = yearMap.get(year) ?? {
        races: 0,
        wins: 0,
        top5s: 0,
        top10s: 0,
        raceKeys: new Set<string>(),
      };

      yearMap.set(year, currentEntry);
      trackMap.set(trackName, yearMap);
      return currentEntry;
    };

    raceEvents.forEach((event) => {
        const trackName = event.trackName.trim();
        if (!trackName) {
          return;
        }

        const year = parseStoredDate(event.eventDate).getFullYear();
        const currentEntry = ensureEntry(trackName, year);
        const raceKey = `${trackName.toLowerCase()}::${event.eventDate}`;

        if (!currentEntry.raceKeys.has(raceKey)) {
          currentEntry.raceKeys.add(raceKey);
          currentEntry.races += 1;
        }
      });

    raceNights.forEach((night) => {
      const trackName = night.trackName.trim();
      if (!trackName) {
        return;
      }

      const year = parseStoredDate(night.eventDate).getFullYear();
      const currentEntry = ensureEntry(trackName, year);
      const raceKey = `${trackName.toLowerCase()}::${night.eventDate}`;

      if (!currentEntry.raceKeys.has(raceKey)) {
        currentEntry.raceKeys.add(raceKey);
        currentEntry.races += 1;
      }

      const parsedFeatureFinish = Number.parseFloat(night.featureFinishPosition);
      if (!Number.isNaN(parsedFeatureFinish) && parsedFeatureFinish > 0) {
        if (parsedFeatureFinish === 1) {
          currentEntry.wins += 1;
        }

        if (parsedFeatureFinish <= 5) {
          currentEntry.top5s += 1;
        }

        if (parsedFeatureFinish <= 10) {
          currentEntry.top10s += 1;
        }
      }
    });

    savedTracks.forEach((track) => {
      const trackName = track.name.trim();
      if (!trackName || trackMap.has(trackName)) {
        return;
      }

      const currentYear = new Date().getFullYear();
      ensureEntry(trackName, currentYear);
    });

    return [...trackMap.entries()]
      .map<TrackSummary>(([trackName, yearMap]) => ({
        trackName,
        yearlyStats: [...yearMap.entries()]
          .map(([year, entry]) => ({
            year,
            races: entry.races,
            wins: entry.wins,
            top5s: entry.top5s,
            top10s: entry.top10s,
          }))
          .sort((a, b) => b.year - a.year),
      }))
      .sort((a, b) => {
        const aRaces = a.yearlyStats.reduce((total, entry) => total + entry.races, 0);
        const bRaces = b.yearlyStats.reduce((total, entry) => total + entry.races, 0);

        if (bRaces !== aRaces) {
          return bRaces - aRaces;
        }

        return a.trackName.localeCompare(b.trackName);
      });
  }, [raceEvents, raceNights, savedTracks]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Previously Raced Tracks</Text>
      <Text style={styles.subhead}>
        Track history by year, including scheduled race counts and average feature finish when
        race-night results are available.
      </Text>

      <View style={styles.card}>
        {trackSummaries.length ? (
          trackSummaries.map((track) => (
            <View key={track.trackName} style={styles.row}>
              <Text style={styles.trackName}>{track.trackName}</Text>
              {track.yearlyStats.map((entry) => (
                <View key={`${track.trackName}-${entry.year}`} style={styles.detailRow}>
                  <Text style={styles.meta}>{entry.year}: {entry.races} races</Text>
                  <Text style={styles.resultBuckets}>
                    {formatFinishBuckets(entry.wins, entry.top5s, entry.top10s)}
                  </Text>
                </View>
              ))}
            </View>
          ))
        ) : knownTrackNames.length ? (
          knownTrackNames.map((trackName) => (
            <View key={trackName} style={styles.row}>
              <Text style={styles.trackName}>{trackName}</Text>
              <Text style={styles.meta}>Track history details are still building for this track.</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            No track history yet. Once the team adds tracks, scheduled races, or saved race nights,
            they will show up here.
          </Text>
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
    borderTopColor: "#21486A",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing(1.5),
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing(1),
    marginTop: 4,
  },
  trackName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  meta: {
    color: colors.subtext,
    flex: 1,
    fontSize: 14,
  },
  resultBuckets: {
    color: "#5AB3FF",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  emptyText: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: spacing(1.5),
  },
});

