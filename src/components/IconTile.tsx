import React, { useRef } from "react";
import {
  TouchableWithoutFeedback,
  Animated,
  Image,
  StyleSheet,
  View,
} from "react-native";

interface IconTileProps {
  label: string;
  icon: any;
  onPress: () => void;
  tileSize: number;
  iconSize: number;
}

export default function IconTile({ label, icon, onPress, tileSize, iconSize }: IconTileProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      accessibilityLabel={label}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.iconBox,
          {
            width: tileSize,
            height: tileSize,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconWrapper}>
          <Image source={icon} style={[styles.icon, { width: iconSize, height: iconSize }]} />
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  iconWrapper: {
    borderRadius: 20,
    padding: 4,
  },
  icon: {
    resizeMode: "contain",
  },
});

