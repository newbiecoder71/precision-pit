import React, { useRef } from "react";
import { Platform, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type KeyboardScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
};

export default function KeyboardScreen({
  children,
  style,
  contentContainerStyle,
  keyboardVerticalOffset = 0,
}: KeyboardScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<KeyboardAwareScrollView>(null);

  useFocusEffect(
    React.useCallback(() => {
      const timeout = setTimeout(() => {
        scrollRef.current?.scrollToPosition?.(0, 0, true);
      }, 0);

      return () => clearTimeout(timeout);
    }, []),
  );

  return (
    <KeyboardAwareScrollView
      ref={scrollRef}
      style={[styles.flex, style]}
      contentContainerStyle={[
        contentContainerStyle,
        { paddingBottom: insets.bottom + 28 + keyboardVerticalOffset },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      extraHeight={Platform.OS === "android" ? 140 : 80}
      extraScrollHeight={Platform.OS === "android" ? 80 : 24}
      enableOnAndroid
      enableAutomaticScroll
      keyboardOpeningTime={0}
      viewIsInsideTabBar={false}
      showsVerticalScrollIndicator={false}
      enableResetScrollToCoords={false}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
