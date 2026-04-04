import React from "react";
import { Text, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation";

const TextComponent = Text as typeof Text & { defaultProps?: Record<string, unknown> };
const TextInputComponent = TextInput as typeof TextInput & {
  defaultProps?: Record<string, unknown>;
};

TextComponent.defaultProps = {
  ...(TextComponent.defaultProps || {}),
  allowFontScaling: true,
  maxFontSizeMultiplier: 1.15,
};

TextInputComponent.defaultProps = {
  ...(TextInputComponent.defaultProps || {}),
  allowFontScaling: true,
  maxFontSizeMultiplier: 1.15,
};

export default function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
