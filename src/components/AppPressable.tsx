import React from "react";
import {
  Pressable as RNPressable,
  PressableProps,
  PressableStateCallbackType,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";

type AppPressableProps = PressableProps & {
  pressedOpacity?: number;
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
};

export default function AppPressable({
  pressedOpacity = 0.78,
  style,
  ...props
}: AppPressableProps) {
  return (
    <RNPressable
      {...props}
      style={(state) => {
        const resolvedStyle = typeof style === "function" ? style(state) : style;

        return [
          resolvedStyle,
          state.pressed ? styles.pressed : undefined,
          state.pressed ? { opacity: pressedOpacity } : undefined,
        ];
      }}
    />
  );
}

const styles = StyleSheet.create({
  pressed: {
    transform: [{ scale: 0.985 }],
  },
});
