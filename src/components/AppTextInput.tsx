import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet as RNStyleSheet, StyleSheet, Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";

const AppTextInput = forwardRef<TextInput, TextInputProps>(function AppTextInput(
  {
    placeholder,
    onFocus,
    onBlur,
    style,
    value,
    multiline,
    ...props
  }: TextInputProps,
  forwardedRef,
) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const stringValue = typeof value === "string" ? value : value == null ? "" : String(value);
  const showPlaceholder = !isFocused && !stringValue.length && !!placeholder;
  const flattenedStyle = RNStyleSheet.flatten(style);
  const rawTextAlign =
    flattenedStyle && !Array.isArray(flattenedStyle) && typeof flattenedStyle.textAlign === "string"
      ? flattenedStyle.textAlign
      : "left";
  const resolvedFontSize =
    flattenedStyle && !Array.isArray(flattenedStyle) && typeof flattenedStyle.fontSize === "number"
      ? flattenedStyle.fontSize
      : undefined;
  const resolvedHeight =
    flattenedStyle && !Array.isArray(flattenedStyle) && typeof flattenedStyle.height === "number"
      ? flattenedStyle.height
      : undefined;
  const resolvedTextAlign =
    rawTextAlign === "center" || rawTextAlign === "right" ? rawTextAlign : "left";
  const singleLinePlaceholderFrame =
    !multiline && resolvedHeight
      ? {
          height: resolvedHeight,
          lineHeight: resolvedHeight,
          top: 0,
          textAlignVertical: "center" as const,
          includeFontPadding: false as const,
        }
      : undefined;

  useImperativeHandle(forwardedRef, () => inputRef.current as TextInput, []);

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <TextInput
        ref={inputRef}
        {...props}
        value={value}
        style={style}
        multiline={multiline}
        textAlign={resolvedTextAlign}
        placeholder=""
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
      />
      {showPlaceholder ? (
        <Text
          pointerEvents="none"
          numberOfLines={multiline ? 3 : 1}
          style={[
            styles.placeholder,
            multiline ? styles.placeholderMultiline : undefined,
            resolvedTextAlign === "center" ? styles.placeholderCentered : undefined,
            resolvedFontSize ? { fontSize: resolvedFontSize } : undefined,
            singleLinePlaceholderFrame,
          ]}
        >
          {placeholder}
        </Text>
      ) : null}
    </View>
  );
});

export default AppTextInput;

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  placeholder: {
    color: "#5E7B94",
    left: 14,
    position: "absolute",
    right: 14,
    top: 14,
  },
  placeholderMultiline: {
    top: 14,
  },
  placeholderCentered: {
    textAlign: "center",
  },
});
