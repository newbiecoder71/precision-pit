import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getSetupSectionsForRacingType } from "../data/racing";
import { colors, spacing } from "../theme";
import { useAppStore } from "../store/useAppStore";

export default function SetupsScreen({ navigation }: any) {
  const scrollRef = React.useRef<ScrollView>(null);
  const { userName, racingType, raceCarType, chassisSetup } = useAppStore();
  const setupSections = getSetupSectionsForRacingType(racingType);
  const hasChassisNotes = Object.values(chassisSetup).some((value) => value.trim().length > 0);

  useFocusEffect(
    React.useCallback(() => {
      const timeout = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }, 0);

      return () => clearTimeout(timeout);
    }, []),
  );

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
      <Image
        source={require("../../assets/icons/setups.png")}
        style={styles.bannerImage}
        resizeMode="contain"
      />
      <Text style={styles.p}>
        {userName ? `Welcome, ${userName}!` : "Set up your driver profile here."}
      </Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Default Racing Type</Text>
        <Text style={styles.summaryValue}>{racingType || "Not set yet"}</Text>

        <Text style={styles.summaryLabel}>Default Race Car Type</Text>
        <Text style={styles.summaryValue}>{raceCarType || "Not set yet"}</Text>

        <Text style={styles.summaryHelp}>
          Tap each setup element below to open its page and enter the team&apos;s baseline
          settings.
        </Text>
      </View>

      {setupSections.map((section) => (
        <Pressable
          key={section.title}
          onPress={() => {
            if (section.title === "Chassis") {
              navigation.getParent()?.navigate("Chassis");
            }
          }}
          style={[
            styles.sectionCard,
            section.title === "Chassis" ? styles.sectionCardActionable : undefined,
          ]}
        >
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.title === "Chassis" ? (
            <Text style={styles.sectionActionMeta}>
              {hasChassisNotes ? "Tap to edit saved chassis settings" : "Tap to enter chassis settings"}
            </Text>
          ) : (
            <Text style={styles.sectionSoonMeta}>Setup page coming next</Text>
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    paddingBottom: spacing(2),
  },
  bannerImage: {
    alignSelf: "center",
    height: 250,
    width: 250,
    marginBottom: spacing(0.25),
    marginTop: spacing(4),
    
  },
  p: {
    color: colors.subtext,
    fontSize: 16,
    marginBottom: spacing(1.5),
    paddingHorizontal: spacing(2),
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing(2),
    marginBottom: spacing(2),
    marginHorizontal: spacing(2),
  },
  summaryLabel: {
    color: "#8ED4FF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: spacing(0.5),
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  summaryValue: {
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing(2.5),
    textAlign: "center",
  },
  summaryHelp: {
    color: "#87AFCB",
    fontSize: 11,
    lineHeight: 20,
    marginTop: -4,
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing(2),
    marginBottom: spacing(1.5),
    marginHorizontal: spacing(2),
  },
  sectionCardActionable: {
    backgroundColor: "#102947",
    borderColor: "#1E5B94",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: spacing(0.25),
    textAlign: "center",
  },
  sectionActionMeta: {
    color: "#5AB3FF",
    fontSize: 11,
    fontWeight: "700",
    marginTop: spacing(0.5),
    textAlign: "center",
  },
  sectionSoonMeta: {
    color: "#6C8CA5",
    fontSize: 11,
    fontWeight: "700",
    marginTop: spacing(0.5),
    textAlign: "center",
  },
});

