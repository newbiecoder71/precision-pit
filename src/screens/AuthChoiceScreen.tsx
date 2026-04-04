import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";

export default function AuthChoiceScreen({ navigation }: any) {
  return (
    <LinearGradient colors={["#09111B", "#001B2D"]} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Image
            source={require("../../assets/logo/app-icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          {/*<Text style={styles.kicker}>Precision Pit</Text>*/}
          <Text style={styles.title}>Login to your team garage.</Text>
          <Text style={styles.body}>
            Create a new team, sign into an existing account, or join a team from an invite
            link.
          </Text>

          <Pressable
            onPress={() => navigation.navigate("CreateAccount")}
            style={[styles.button, styles.primaryButton]}
          >
            <Text style={styles.primaryButtonText}>Create Team</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("Login")}
            style={[styles.button, styles.secondaryButton]}
          >
            <Text style={styles.secondaryButtonText}>Log In</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate("AcceptInvite")} style={styles.linkButton}>
            <Text style={styles.linkText}>Join Team</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 250,
    height: 250,
    alignSelf: "center",
    marginBottom: 10,
  },
  kicker: {
    color: "#39B4FF",
    fontSize: 18,
    fontWeight: "800",
    fontStyle: "italic",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: "center",
  },
  title: {
    color: "#EFF9FF",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    marginBottom: 14,
  },
  body: {
    color: "#A9C7DD",
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 28,
  },
  button: {
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: "#1780D4",
    shadowColor: "#1780D4",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "#21486A",
  },
  primaryButtonText: {
    color: "#F4FBFF",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  secondaryButtonText: {
    color: "#8ED4FF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  linkText: {
    color: "#8ED4FF",
    fontSize: 17,
    fontWeight: "700",
  },
});

