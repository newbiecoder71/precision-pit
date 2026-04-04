import React, { useRef, useState } from "react";
import {
  FlatList,
  Image,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";

const slides = [
  {
    id: "prep",
    eyebrow: "Race-Day Ready",
    title: "Track your team setup in one place.",
    body:
      "Precision Pit keeps your race prep organized with a fast home dashboard for shocks, tires, gears, setups, and checklists.",
  },
  {
    id: "speed",
    eyebrow: "Quick Decisions",
    title: "Capture changes before they cost you laps.",
    body:
      "Keep setup notes close at hand so your crew can make smarter calls between sessions without chasing paper or memory.",
  },
  {
    id: "team",
    eyebrow: "Built for Teams",
    title: "Create your team and get to work.",
    body:
      "Start a new team space or log into an existing account so your garage can keep everything aligned from the first run.",
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 0.58, 236);
  const listRef = useRef<FlatList<(typeof slides)[number]>>(null);
  const [index, setIndex] = useState(0);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const renderSlide = ({ item }: ListRenderItemInfo<(typeof slides)[number]>) => (
    <View style={[styles.slide, { width }]}>
      <Text style={styles.eyebrow}>{item.eyebrow}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.body}</Text>
    </View>
  );

  return (
    <LinearGradient colors={["#09111B", "#001B2D", "#071A35"]} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.skipRow}>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.logoWrap}>
          <Image
            source={require("../../assets/logo/app-icon.png")}
            style={[styles.logo, { width: logoSize, height: logoSize }]}
            resizeMode="contain"
          />
        </View>

        <FlatList
          ref={listRef}
          data={slides}
          horizontal
          pagingEnabled
          keyExtractor={(item) => item.id}
          renderItem={renderSlide}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            setIndex(nextIndex);
          }}
        />

        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((slide, dotIndex) => (
              <View
                key={slide.id}
                style={[styles.dot, dotIndex === index ? styles.dotActive : undefined]}
              />
            ))}
          </View>

          <Pressable onPress={handleSkip} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  skipRow: {
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  skipButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logoWrap: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 12,
  },
  logo: {
    width: 136,
    height: 136,
  },
  skipText: {
    color: "#8ED4FF",
    fontSize: 16,
    fontWeight: "700",
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 16,
    paddingTop: 8,
  },
  eyebrow: {
    color: "#39B4FF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 14,
    textTransform: "uppercase",
  },
  title: {
    color: "#E6F5FF",
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    marginBottom: 16,
  },
  body: {
    color: "#A9C7DD",
    fontSize: 18,
    lineHeight: 28,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#21486A",
  },
  dotActive: {
    width: 28,
    backgroundColor: "#39B4FF",
  },
  primaryButton: {
    minWidth: 220,
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#1780D4",
    paddingHorizontal: 24,
    paddingVertical: 16,
    shadowColor: "#1780D4",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  primaryButtonText: {
    color: "#F3FAFF",
    fontSize: 18,
    fontWeight: "800",
  },
});

