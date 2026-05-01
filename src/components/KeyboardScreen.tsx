import React, { useRef } from "react";
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type KeyboardScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
  keyboardShouldPersistTaps?: "always" | "handled" | "never";
  keyboardDismissMode?: "none" | "on-drag" | "interactive";
  stickyHeaderIndices?: number[];
  scrollRef?: React.RefObject<KeyboardAwareScrollView | null>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export default function KeyboardScreen({
  children,
  style,
  contentContainerStyle,
  keyboardVerticalOffset = 0,
  keyboardShouldPersistTaps = "always",
  keyboardDismissMode = "none",
  stickyHeaderIndices,
  scrollRef,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
}: KeyboardScreenProps) {
  const insets = useSafeAreaInsets();
  const internalScrollRef = useRef<KeyboardAwareScrollView>(null);
  const resolvedScrollRef = scrollRef ?? internalScrollRef;

  useFocusEffect(
    React.useCallback(() => {
      const timeout = setTimeout(() => {
        resolvedScrollRef.current?.scrollToPosition?.(0, 0, true);
      }, 0);

      return () => clearTimeout(timeout);
    }, [resolvedScrollRef]),
  );

  return (
    <KeyboardAwareScrollView
      ref={resolvedScrollRef}
      style={[styles.flex, style]}
      contentContainerStyle={[
        contentContainerStyle,
        { paddingBottom: insets.bottom + 28 + keyboardVerticalOffset },
      ]}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode={keyboardDismissMode}
      onScroll={onScroll}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollEnd={onMomentumScrollEnd}
      scrollEventThrottle={16}
      extraHeight={Platform.OS === "android" ? 140 : 80}
      extraScrollHeight={Platform.OS === "android" ? 80 : 24}
      enableOnAndroid
      enableAutomaticScroll
      keyboardOpeningTime={0}
      viewIsInsideTabBar={false}
      showsVerticalScrollIndicator={false}
      enableResetScrollToCoords={false}
      stickyHeaderIndices={stickyHeaderIndices}
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
