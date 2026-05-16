import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Pressable,
  GestureResponderEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import TextInput from "../components/AppTextInput";
import KeyboardScreen from "../components/KeyboardScreen";
import { SuspensionSetup, useAppStore } from "../store/useAppStore";
import { colors, spacing } from "../theme";

type SuspensionFieldKey = keyof SuspensionSetup;

type SuspensionField = {
  key: SuspensionFieldKey;
  label: string;
  placeholder: string;
  multiline?: boolean;
};

const frontSuspensionFields: SuspensionField[] = [
  {
    key: "frontSprings",
    label: "Front Springs",
    placeholder: "LF 550 / RF 600",
  },
  {
    key: "frontShocks",
    label: "Front Shocks",
    placeholder: "LF 4-3 / RF 5-2",
  },
  {
    key: "camber",
    label: "Camber",
    placeholder: "LF +2.0 / RF -4.0",
  },
  {
    key: "caster",
    label: "Caster",
    placeholder: "LF +2.5 / RF +6.0",
  },
  {
    key: "toe",
    label: "Toe",
    placeholder: "1/8 out",
  },
  {
    key: "travelBumpStops",
    label: "Travel / Bump Stops",
    placeholder: "RF 2.0 in travel, 1 in bump stop gap",
    multiline: true,
  },
];

const rearSuspensionFields: SuspensionField[] = [
  {
    key: "rearSprings",
    label: "Rear Springs",
    placeholder: "LR 225 / RR 200",
  },
  {
    key: "rearShocks",
    label: "Rear Shocks",
    placeholder: "LR 6-2 / RR 4-4",
  },
  {
    key: "trailingArmAngles",
    label: "Trailing Arm Angles",
    placeholder: "LR 2 down, RR level",
  },
  {
    key: "pullBarLiftArm",
    label: "Pull Bar / Lift Arm",
    placeholder: "Pull bar 18 in, 3rd hole",
  },
  {
    key: "jBarPanhardHeight",
    label: "J-Bar / Panhard Height",
    placeholder: "Frame 9 in / Rearend 8 in",
  },
  {
    key: "birdcageIndexingNotes",
    label: "Birdcage / Indexing Notes",
    placeholder: "LR birdcage indexed 5 degrees, RR neutral",
    multiline: true,
  },
];

function SuspensionFieldInput({
  field,
  value,
  onChangeText,
}: {
  field: SuspensionField;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{field.label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={field.placeholder}
        placeholderTextColor="#5E7B94"
        multiline={field.multiline}
        textAlignVertical={field.multiline ? "top" : "center"}
        style={[styles.input, field.multiline ? styles.inputMultiline : undefined]}
      />
    </View>
  );
}

export default function ShocksScreen() {
  const userName = useAppStore((state) => state.userName);
  const suspensionSetup = useAppStore((state) => state.suspensionSetup);
  const saveSuspensionSetup = useAppStore((state) => state.saveSuspensionSetup);
  const [draftSetup, setDraftSetup] = useState<SuspensionSetup>(suspensionSetup);

  useEffect(() => {
    setDraftSetup(suspensionSetup);
  }, [suspensionSetup]);

  const handleChange = (field: SuspensionFieldKey, value: string) => {
    setDraftSetup((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      await saveSuspensionSetup(draftSetup);
      Alert.alert("Saved", "Suspension setup notes were saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save suspension setup.";
      Alert.alert("Save failed", message);
    }
  };

  const dismissKeyboardOnBackgroundTap = (event: GestureResponderEvent) => {
    if (event.target === event.currentTarget) {
      Keyboard.dismiss();
    }
  };

  return (
    <KeyboardScreen contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View onStartShouldSetResponder={() => true} onResponderRelease={dismissKeyboardOnBackgroundTap}>
        <Image
          source={require("../../assets/icons/shocks.png")}
          style={styles.bannerImage}
          resizeMode="contain"
        />

        {userName ? <Text style={styles.welcomeText}>{`Welcome, ${userName}!`}</Text> : null}
        <Text style={styles.pageTitle}>Suspension</Text>
        <Text style={styles.p}>
          Save your baseline front and rear suspension settings here so race-night changes have a
          clean starting point.
        </Text>
      </View>

      <View
        style={styles.card}
        onStartShouldSetResponder={() => true}
        onResponderRelease={dismissKeyboardOnBackgroundTap}
      >
        <Text style={styles.sectionTitle}>Front Suspension</Text>
        {frontSuspensionFields.map((field) => (
          <SuspensionFieldInput
            key={field.key}
            field={field}
            value={draftSetup[field.key]}
            onChangeText={(value) => handleChange(field.key, value)}
          />
        ))}
      </View>

      <View
        style={styles.card}
        onStartShouldSetResponder={() => true}
        onResponderRelease={dismissKeyboardOnBackgroundTap}
      >
        <Text style={styles.sectionTitle}>Rear Suspension</Text>
        {rearSuspensionFields.map((field) => (
          <SuspensionFieldInput
            key={field.key}
            field={field}
            value={draftSetup[field.key]}
            onChangeText={(value) => handleChange(field.key, value)}
          />
        ))}
      </View>

      <Pressable onPress={handleSave} style={styles.button}>
        <Text style={styles.buttonText}>Save Suspension Setup</Text>
      </Pressable>
    </KeyboardScreen>
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
    width: "100%",
    marginBottom: spacing(0.25),
    marginTop: spacing(4),
  },
  welcomeText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: spacing(0.5),
    paddingHorizontal: spacing(2),
    textAlign: "center",
  },
  pageTitle: {
    color: "#EAF7FF",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: spacing(0.5),
    paddingHorizontal: spacing(2),
    textAlign: "center",
  },
  p: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing(1.5),
    paddingHorizontal: spacing(2),
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing(2),
    marginHorizontal: spacing(2),
    padding: spacing(2),
  },
  sectionTitle: {
    color: "#8ED4FF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: spacing(1.25),
    textAlign: "center",
    textTransform: "uppercase",
  },
  fieldBlock: {
    marginBottom: spacing(1.5),
  },
  label: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: spacing(0.5),
    textAlign: "center",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
    borderRadius: 16,
    borderWidth: 1,
    color: "#EAF7FF",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    textAlign: "center",
  },
  inputMultiline: {
    minHeight: 88,
    textAlign: "left",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    marginHorizontal: spacing(2),
    marginTop: spacing(0.5),
    paddingVertical: 14,
  },
  buttonText: {
    color: "#F3FAFF",
    fontSize: 15,
    fontWeight: "800",
  },
});


