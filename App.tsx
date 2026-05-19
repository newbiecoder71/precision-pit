import React from "react";
import { Text, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation";
import { Analytics } from "@vercel/analytics/react";

const TextComponent = Text as typeof Text & { defaultProps?: Record<string, unknown> };
const TextInputComponent = TextInput as typeof TextInput & {
  defaultProps?: Record<string, unknown>;
};

TextComponent.defaultProps = {
  ...(TextComponent.defaultProps || {}),
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
};

TextInputComponent.defaultProps = {
  ...(TextInputComponent.defaultProps || {}),
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
};

export default function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
      <StatusBar style="light" />
      <Analytics />
    </SafeAreaProvider>
  );
}
