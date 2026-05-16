import React, { useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import TextInput from "../components/AppTextInput";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAppStore } from "../store/useAppStore";
import {
  BIOMETRIC_CREDENTIALS_KEY,
  BIOMETRIC_ENABLED_KEY,
  REMEMBERED_EMAIL_KEY,
} from "../constants/authPreferences";
import { colors } from "../theme";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const storedEmail = useAppStore((state) => state.userEmail);
  const [email, setEmail] = useState(storedEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordHovered, setIsForgotPasswordHovered] = useState(false);
  const [isLoginHovered, setIsLoginHovered] = useState(false);
  const [shouldFocusPasswordOnLoad, setShouldFocusPasswordOnLoad] = useState(false);
  const logIn = useAppStore((state) => state.logIn);
  const emailInputRef = useRef<RNTextInput>(null);
  const passwordInputRef = useRef<RNTextInput>(null);
  const webTextCursor = Platform.OS === "web" ? ({ cursor: "text" } as any) : undefined;
  const webPointerCursor = Platform.OS === "web" ? ({ cursor: "pointer" } as any) : undefined;

  React.useEffect(() => {
    let isMounted = true;

    const loadLoginPreferences = async () => {
      try {
        const rememberedEmail = await AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
        const biometricEnabled = (await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY)) === "true";
        const savedCredentials = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!isMounted) {
          return;
        }

        if (rememberedEmail?.trim()) {
          setEmail(rememberedEmail);
          setRememberMe(true);
          setShouldFocusPasswordOnLoad(true);
        } else if (savedCredentials) {
          try {
            const parsedCredentials = JSON.parse(savedCredentials) as { email?: string };
            if (parsedCredentials.email?.trim()) {
              setEmail(parsedCredentials.email);
              setShouldFocusPasswordOnLoad(true);
            }
          } catch {
            // Ignore malformed saved credentials and let secure login be reset on next sign in.
          }
        }

        setBiometricReady(Boolean(savedCredentials) && biometricEnabled && hasHardware && isEnrolled);
      } finally {
        if (isMounted) {
          setIsBiometricLoading(false);
        }
      }
    };

    void loadLoginPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (isBiometricLoading || !shouldFocusPasswordOnLoad) {
      return;
    }

    const focusTimeout = setTimeout(() => {
      passwordInputRef.current?.focus();
      setShouldFocusPasswordOnLoad(false);
    }, 150);

    return () => clearTimeout(focusTimeout);
  }, [isBiometricLoading, shouldFocusPasswordOnLoad]);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing information", "Enter your email address and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const hasTeam = await logIn({ email, password });
      const biometricEnabled = (await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY)) === "true";

      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim().toLowerCase());
      } else {
        await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      if (rememberMe || biometricEnabled) {
        await SecureStore.setItemAsync(
          BIOMETRIC_CREDENTIALS_KEY,
          JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        );
      } else {
        await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricReady((rememberMe || biometricEnabled) && hasHardware && isEnrolled);

      if (!hasTeam) {
        Alert.alert(
          "No team linked yet",
          "You signed in successfully, but there is no active team membership on this account yet. Use Accept Invite if a team owner invited you.",
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to log in.";
      Alert.alert("Login failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const savedCredentials = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      if (!savedCredentials) {
        Alert.alert("Fingerprint not ready", "Sign in once with Remember Me checked to enable fingerprint login.");
        return;
      }

      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Use fingerprint to log in",
        fallbackLabel: "Use password",
        cancelLabel: "Cancel",
      });

      if (!biometricResult.success) {
        return;
      }

      const parsedCredentials = JSON.parse(savedCredentials) as {
        email: string;
        password: string;
      };

      setIsSubmitting(true);
      const hasTeam = await logIn(parsedCredentials);
      setEmail(parsedCredentials.email);
      setRememberMe(true);

      if (!hasTeam) {
        Alert.alert(
          "No team linked yet",
          "You signed in successfully, but there is no active team membership on this account yet. Use Join Team if a team owner invited you.",
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to use fingerprint login.";
      Alert.alert("Fingerprint login failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={["#09111B", "#001B2D"]} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 96 : 24}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardDismissMode="none"
            keyboardShouldPersistTaps="always"
          >
            <Pressable onPress={() => navigation.navigate("AuthChoice")} style={styles.backButton}>
              <Text style={styles.backButtonText}>{"< Back"}</Text>
            </Pressable>

            <Image
              source={require("../../assets/logo/app-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Log in</Text>
            <Text style={styles.body}>
              Use the same email address you signed up with or were invited with.
            </Text>

            <TextInput
              ref={emailInputRef}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, webTextCursor]}
              placeholder="Email address"
              placeholderTextColor="#4F7390"
              value={email}
              onChangeText={setEmail}
            />

            <View style={styles.passwordFieldWrap}>
              <TextInput
                ref={passwordInputRef}
                secureTextEntry={!showPassword}
                style={[styles.input, styles.passwordInput, webTextCursor]}
                placeholder="Password"
                placeholderTextColor="#4F7390"
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                onPress={() => setShowPassword((current) => !current)}
                style={styles.passwordToggle}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color="#8ED4FF"
                />
              </Pressable>
            </View>

            <Pressable
              onPress={() => setRememberMe((current) => !current)}
              style={styles.rememberRow}
            >
              <View style={[styles.checkbox, rememberMe ? styles.checkboxChecked : undefined]}>
                {rememberMe ? <Text style={styles.checkboxCheck}>✓</Text> : null}
              </View>
              <Text style={styles.rememberText}>Remember Me</Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate("ForgotPassword")}
              onHoverIn={() => setIsForgotPasswordHovered(true)}
              onHoverOut={() => setIsForgotPasswordHovered(false)}
              style={({ pressed }) => [
                styles.linkRow,
                webPointerCursor,
                isForgotPasswordHovered ? styles.linkRowHover : undefined,
                pressed ? styles.linkRowPressed : undefined,
              ]}
            >
              <Text
                style={[styles.linkText, isForgotPasswordHovered ? styles.linkTextHover : undefined]}
              >
                Forgot Password?
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              onHoverIn={() => setIsLoginHovered(true)}
              onHoverOut={() => setIsLoginHovered(false)}
              style={({ pressed }) => [
                styles.button,
                webPointerCursor,
                isLoginHovered ? styles.buttonHover : undefined,
                pressed ? styles.buttonPressed : undefined,
              ]}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#F3FAFF" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </Pressable>

            {!isBiometricLoading && biometricReady ? (
              <Pressable onPress={handleBiometricLogin} style={styles.secondaryButton} disabled={isSubmitting}>
                <Text style={styles.secondaryButtonText}>Use Fingerprint</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardContainer: {
    flex: 1,
  },
  container: {
    minHeight: "100%",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
    marginTop: 8,
    paddingVertical: 8,
  },
  backButtonText: {
    color: "#8ED4FF",
    fontSize: 16,
    fontWeight: "700",
  },
  logo: {
    width: "100%",
    height: 250,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    color: "#EFF9FF",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 12,
  },
  body: {
    color: "#A9C7DD",
    fontSize: 17,
    lineHeight: 26,
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "#21486A",
    color: "#EAF7FF",
    fontSize: 18,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  passwordFieldWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    top: 6,
    width: 32,
  },
  linkRow: {
    alignSelf: "flex-end",
    marginBottom: 14,
    marginTop: -2,
  },
  linkRowHover: {
    opacity: 0.92,
  },
  linkRowPressed: {
    opacity: 0.78,
  },
  rememberRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    marginTop: -2,
  },
  checkbox: {
    alignItems: "center",
    borderColor: "#5AB3FF",
    borderRadius: 6,
    borderWidth: 2,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: "#1780D4",
  },
  checkboxCheck: {
    color: "#F3FAFF",
    fontSize: 13,
    fontWeight: "900",
  },
  rememberText: {
    color: "#A9C7DD",
    fontSize: 15,
    fontWeight: "700",
  },
  linkText: {
    color: "#5AB3FF",
    fontSize: 15,
    fontWeight: "700",
  },
  linkTextHover: {
    textDecorationLine: "underline",
  },
  button: {
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#1780D4",
    marginTop: 6,
    paddingVertical: 16,
  },
  buttonHover: {
    backgroundColor: "#1E8DE8",
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: "#F3FAFF",
    fontSize: 18,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#21486A",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    color: "#8ED4FF",
    fontSize: 17,
    fontWeight: "800",
  },
});


