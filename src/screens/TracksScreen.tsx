import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import TextInput from "../components/AppTextInput";
import { dirtOvalTracks } from "../data/dirtOvalTracks";
import { colors, spacing } from "../theme";

export default function TracksScreen({ navigation }: any) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [search, setSearch] = useState("");
  const [selectedTrackName, setSelectedTrackName] = useState<string>();
  const trimmedSearch = search.trim();
  const showSearchResults = trimmedSearch.length >= 1;

  const filteredTracks = useMemo(() => {
    const normalizedSearch = trimmedSearch.toLowerCase();

    if (!showSearchResults) {
      return [];
    }

    const matchingTracks = dirtOvalTracks.filter((track) => {
      return [track.name, track.city, track.state, "Dirt Oval"].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      );
    });

    return matchingTracks.sort((a, b) => {
      const stateSort = a.state.localeCompare(b.state);
      if (stateSort !== 0) {
        return stateSort;
      }

      return a.name.localeCompare(b.name);
    });
  }, [showSearchResults, trimmedSearch]);

  const handleTrackPress = async (trackName: string) => {
    const track = dirtOvalTracks.find((item) => item.name === trackName);

    if (!track) {
      return;
    }

    setSelectedTrackName(track.name);
    setSearch(track.name);

    if (track.myRacePassUrl) {
      await Linking.openURL(track.myRacePassUrl);
      return;
    }

    Alert.alert(
      "Direct Profile Not Mapped",
      `A direct MyRacePass track profile URL is not mapped yet for ${track.name}. Open the MyRacePass tracks directory instead?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Directory",
          onPress: () => {
            void Linking.openURL("https://www.myracepass.com/tracks/");
          },
        },
      ],
    );
  };

  const scrollSearchAreaIntoView = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 360, animated: true });
    }, 150);
  };

  const handleOpenPreviousTracks = () => {
    const parentNavigation = navigation.getParent?.();

    if (parentNavigation?.push) {
      parentNavigation.push("PreviousTracks");
      return;
    }

    if (parentNavigation?.navigate) {
      parentNavigation.navigate("PreviousTracks");
      return;
    }

    if (navigation.push) {
      navigation.push("PreviousTracks");
      return;
    }

    navigation.navigate?.("PreviousTracks");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 96 : 24}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require("../../assets/icons/tracks.png")}
          style={styles.bannerImage}
          resizeMode="contain"
        />

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tracks..."
            placeholderTextColor="#4F7390"
            value={search}
            onChangeText={(value) => {
              setSearch(value);
              if (value.trim().length > 0) {
                scrollSearchAreaIntoView();
              }
            }}
            onFocus={() => {
              scrollSearchAreaIntoView();
            }}
          />
          {search ? (
            <Pressable
              onPress={() => {
                setSearch("");
                setSelectedTrackName(undefined);
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>x</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.instructionsText}>
          Start typing to search. Results will appear as soon as a track matches. Tap a
          track name to open its MyRacePass track profile.
        </Text>

        <View style={styles.card}>
          {!showSearchResults ? (
            <Text style={styles.emptyText}>Track results will appear here.</Text>
          ) : filteredTracks.length ? (
            filteredTracks.map((track) => {
              const isSelected = selectedTrackName === track.name;

              return (
                <Pressable
                  key={`${track.name}-${track.state}`}
                  onPress={() => {
                    void handleTrackPress(track.name);
                  }}
                  style={[styles.trackRow, isSelected ? styles.trackRowSelected : undefined]}
                >
                  <View style={styles.trackCopy}>
                    <Text style={styles.trackName}>{track.name}</Text>
                    <Text style={styles.trackMeta}>
                      {track.city}, {track.state}
                    </Text>
                    <Text style={styles.trackType}>Dirt Oval</Text>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No tracks matched that search.</Text>
          )}
        </View>
        <Pressable
          onPress={handleOpenPreviousTracks}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Previously Raced Tracks</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing(2),
    paddingBottom: spacing(3),
  },
  bannerImage: {
    alignSelf: "center",
    height: 300,
    marginBottom: spacing(1),
    marginTop: spacing(4),
    width: "100%",
  },
  searchRow: {
    justifyContent: "center",
    marginBottom: spacing(1.5),
  },
  searchInput: {
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 16,
    borderWidth: 1,
    color: "#EAF7FF",
    fontSize: 16,
    marginBottom: 0,
    paddingRight: 52,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  clearButton: {
    alignItems: "center",
    backgroundColor: "#163046",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    width: 30,
  },
  clearButtonText: {
    color: "#9BAABA",
    fontSize: 12,
    fontWeight: "700",
  },
  instructionsText: {
    color: colors.subtext,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing(1.25),
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing(2),
    paddingHorizontal: spacing(2),
  },
  trackRow: {
    borderTopColor: "#21486A",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing(1.25),
  },
  trackRowSelected: {
    backgroundColor: "#102947",
    marginHorizontal: -spacing(2),
    paddingHorizontal: spacing(2),
  },
  trackCopy: {
    flex: 1,
  },
  trackName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },
  trackMeta: {
    color: colors.subtext,
    fontSize: 14,
    marginBottom: 4,
  },
  trackType: {
    color: "#8ED4FF",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  emptyText: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: spacing(1.5),
    textAlign: "center",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "#21486A",
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: spacing(2),
    paddingVertical: 15,
  },
  secondaryButtonText: {
    color: "#8ED4FF",
    fontSize: 16,
    fontWeight: "800",
  },
});


