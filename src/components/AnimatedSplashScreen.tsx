import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function AnimatedSplashScreen() {
  const { width, height } = useWindowDimensions();
  const spinValue = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(2)).current;
  const titleScale = useRef(new Animated.Value(0.82)).current;

  const logoSize = useMemo(() => {
    const shortestSide = Math.min(width, height);
    return Math.max(210, Math.min(shortestSide * 0.56, 320));
  }, [height, width]);

  const titleWidth = useMemo(() => {
    return Math.max(320, Math.min(width * 1.05, 520));
  }, [width]);

  const titleHeight = useMemo(() => {
    return Math.max(76, Math.min(width * 0.28, 150));
  }, [width]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1900,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(900),
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslate, {
            toValue: 0,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleScale, {
            toValue: 1.9,
            duration: 900,
            easing: Easing.out(Easing.back(1.1)),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [spinValue, titleOpacity, titleScale, titleTranslate]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "720deg"],
  });

  return (
    <LinearGradient colors={["#07111A", "#09233A", "#07111A"]} style={styles.container}>
      <View style={styles.centerStack}>
        <Animated.Image
          source={require("../../assets/logo/app-icon1-splash.png")}
          resizeMode="contain"
          style={[
            styles.logo,
            {
              height: logoSize,
              width: logoSize,
              marginBottom: 0,
            },
            {
              transform: [{ rotate: spin }],
            },
          ]}
        />
        <Animated.Image
          source={require("../../assets/logo/PP-title-splash.png")}
          resizeMode="contain"
          style={[
            styles.titleImage,
            {
              height: titleHeight,
              width: titleWidth,
            },
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslate }, { scale: titleScale }],
            },
          ]}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerStack: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    width: "100%",
  },
  logo: {
    maxWidth: "100%",
  },
  titleImage: {
    maxWidth: "100%",
  },
});

