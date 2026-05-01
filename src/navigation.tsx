import React, { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { BottomTabBarProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AnimatedSplashScreen from "./components/AnimatedSplashScreen";
import HomeScreen from "./screens/HomeScreen";
import AccountScreen from "./screens/AccountScreen";
import GearsScreen from "./screens/GearsScreen";
import SetupsScreen from "./screens/SetupsScreen";
import TiresScreen from "./screens/TiresScreen";
import ShocksScreen from "./screens/ShocksScreen";
import EventsScreen from "./screens/EventsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import AuthChoiceScreen from "./screens/AuthChoiceScreen";
import CreateTeamScreen from "./screens/CreateTeamScreen";
import LoginScreen from "./screens/LoginScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import AcceptInviteScreen from "./screens/AcceptInviteScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import TeamMembersScreen from "./screens/TeamMembersScreen";
import InviteMemberScreen from "./screens/InviteMemberScreen";
import SavedTracksScreen from "./screens/SavedTracksScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import ChassisScreen from "./screens/ChassisScreen";
import EventDetailScreen from "./screens/EventDetailScreen";
import PastRacesScreen from "./screens/PastRacesScreen";
import PreviousTracksScreen from "./screens/PreviousTracksScreen";
import RaceNightScreen from "./screens/RaceNightScreen";
import RaceNightPrintScreen from "./screens/RaceNightPrintScreen";
import RaceNightSetupChangesScreen from "./screens/RaceNightSetupChangesScreen";
import TracksScreen from "./screens/TracksScreen";
import PrivacyScreen from "./screens/PrivacyScreen";
import SupportScreen from "./screens/SupportScreen";
import TermsScreen from "./screens/TermsScreen";
import { colors } from "./theme";
import { useAppStore } from "./store/useAppStore";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const iconMap: Record<string, any> = {
  Home: require("../assets/icons/home.png"),
  Account: require("../assets/icons/account.png"),
  Gears: require("../assets/icons/gears.png"),
  Setups: require("../assets/icons/setups.png"),
  Tires: require("../assets/icons/tires.png"),
  Shocks: require("../assets/icons/shocks.png"),
  Events: require("../assets/icons/events.png"),
  Settings: require("../assets/icons/settings.png"),
  Tracks: require("../assets/icons/tracks.png"),
};

const stackHeaderStyle = {
  backgroundColor: colors.bg,
};

function buildStackOptions(title: string, backLabel = "Back") {
  return ({ navigation }: any) => ({
    headerShown: true,
    title: "",
    headerTitle: "",
    headerStyle: stackHeaderStyle,
    headerTintColor: colors.text,
    headerTitleAlign: "center" as const,
    headerBackTitle: "Back",
    headerBackVisible: false,
    headerLeft: () => (
      <Pressable
        accessibilityLabel="Back"
        hitSlop={10}
        onPress={() => navigation.goBack()}
        style={styles.headerBackButton}
      >
        <Ionicons name="arrow-back" size={22} color={colors.text} />
        <Text style={styles.headerBackLabel}>Back</Text>
      </Pressable>
    ),
  });
}

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    border: colors.border,
    primary: colors.primary,
    text: colors.text,
    notification: colors.primary,
  },
};

const tabLabels: Record<string, string> = {
  Home: "Home",
  Account: "Account",
  Gears: "Gears",
  Setups: "Setups",
  Tires: "Tires",
  Shocks: "Shocks",
  Events: "Events",
  Settings: "Settings",
  Tracks: "Tracks",
};

function HorizontalTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarShell, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBarScrollContent}
      >
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const options = descriptor.options;
          const label = tabLabels[route.name] || route.name;
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabButton, focused ? styles.tabButtonFocused : undefined]}
            >
              <Image
                source={iconMap[route.name]}
                style={[styles.tabIcon, focused ? styles.tabIconFocused : undefined]}
                resizeMode="contain"
              />
              <Text style={[styles.tabLabel, focused ? styles.tabLabelFocused : undefined]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function MainTabs({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.mainTabsShell}>
      <Tab.Navigator
        tabBar={(props) => <HorizontalTabBar {...props} />}
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          sceneStyle: { backgroundColor: colors.bg },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.subtext,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Account" component={AccountScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Gears" component={GearsScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Setups" component={SetupsScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Tires" component={TiresScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Shocks" component={ShocksScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Events" component={EventsScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Tracks" component={TracksScreen} options={{ headerShown: false }} />
      </Tab.Navigator>

      <Pressable
        accessibilityLabel="Open account"
        onPress={() => navigation.push("AccountProfile")}
        style={[styles.profileShortcut, { top: insets.top + 8 }]}
      >
        <Ionicons name="person-circle-outline" size={30} color="#EAF7FF" />
      </Pressable>
    </View>
  );
}

function SignedInStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "none",
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="AccountProfile"
        component={AccountScreen}
        options={({ navigation }: any) => ({
          ...buildStackOptions("Account", "Home")({ navigation }),
          animation: "slide_from_right",
        })}
      />
      <Stack.Screen
        name="TeamMembers"
        component={TeamMembersScreen}
        options={buildStackOptions("Team Members", "Account")}
      />
      <Stack.Screen
        name="InviteMember"
        component={InviteMemberScreen}
        options={buildStackOptions("Invite Member", "Team Members")}
      />
      <Stack.Screen
        name="SavedTracks"
        component={SavedTracksScreen}
        options={buildStackOptions("Saved Tracks", "Account")}
      />
      <Stack.Screen
        name="Chassis"
        component={ChassisScreen}
        options={buildStackOptions("Chassis", "Setups")}
      />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={buildStackOptions("Event Detail", "Events")}
      />
      <Stack.Screen
        name="RaceNight"
        component={RaceNightScreen}
        options={buildStackOptions("Race Night")}
      />
      <Stack.Screen
        name="RaceNightPrint"
        component={RaceNightPrintScreen}
        options={buildStackOptions("Print Race Night", "Past Races")}
      />
      <Stack.Screen
        name="RaceNightSetupChanges"
        component={RaceNightSetupChangesScreen}
        options={buildStackOptions("Setup Changes", "Race Night")}
      />
      <Stack.Screen
        name="PreviousTracks"
        component={PreviousTracksScreen}
        options={buildStackOptions("Previously Raced Tracks", "Tracks")}
      />
      <Stack.Screen
        name="PastRaces"
        component={PastRacesScreen}
        options={buildStackOptions("Past Races")}
      />
      <Stack.Screen
        name="Tracks"
        component={TracksScreen}
        options={buildStackOptions("Tracks")}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={buildStackOptions("Privacy", "Home")}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={buildStackOptions("Support", "Home")}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={buildStackOptions("Terms & Conditions", "Support")}
      />
    </Stack.Navigator>
  );
}

function LaunchGate() {
  const hydrate = useAppStore((state) => state.hydrate);
  const isHydrated = useAppStore((state) => state.isHydrated);
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);
  const hasExistingLoginProfile = useAppStore((state) => state.hasExistingLoginProfile);
  const isPasswordRecovery = useAppStore((state) => state.isPasswordRecovery);
  const inviteLinkEmail = useAppStore((state) => state.inviteLinkEmail);
  const inviteLinkToken = useAppStore((state) => state.inviteLinkToken);
  const teamName = useAppStore((state) => state.teamName);
  const userEmail = useAppStore((state) => state.userEmail);
  const handleAuthRedirect = useAppStore((state) => state.handleAuthRedirect);
  const [isSplashFinished, setIsSplashFinished] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsSplashFinished(true);
    }, 2600);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const processUrl = async (url: string | null) => {
      if (!url || !isMounted || !url.includes("precisionpit://")) {
        return;
      }

      try {
        await handleAuthRedirect(url);
      } catch {
        // Ignore malformed or stale auth callback URLs and let normal auth continue.
      }
    };

    Linking.getInitialURL().then(processUrl);
    const subscription = Linking.addEventListener("url", ({ url }) => {
      processUrl(url);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [handleAuthRedirect]);

  if (!isHydrated || !isSplashFinished) {
    return <AnimatedSplashScreen />;
  }

  if ((inviteLinkEmail || inviteLinkToken) && !teamName) {
    return (
      <Stack.Navigator
        initialRouteName="AcceptInvite"
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} />
        <Stack.Screen name="CreateAccount" component={CreateTeamScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="AcceptInvite" component={AcceptInviteScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </Stack.Navigator>
    );
  }

  if (!hasSeenOnboarding) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  if (isPasswordRecovery) {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </Stack.Navigator>
    );
  }

  if (!teamName || !userEmail) {
    return (
      <Stack.Navigator
        initialRouteName={hasExistingLoginProfile ? "Login" : "AuthChoice"}
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} />
        <Stack.Screen name="CreateAccount" component={CreateTeamScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="AcceptInvite" component={AcceptInviteScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </Stack.Navigator>
    );
  }

  return <SignedInStack />;
}

export default function RootNavigator() {
  return (
    <NavigationContainer
      theme={navigationTheme}
      linking={{
        prefixes: ["precisionpit://"],
      }}
    >
      <LaunchGate />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarShell: {
    backgroundColor: colors.bg,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tabBarScrollContent: {
    gap: 8,
    paddingHorizontal: 10,
  },
  tabButton: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 76,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tabButtonFocused: {
    backgroundColor: "#0E223B",
    borderColor: "#21486A",
  },
  tabIcon: {
    height: 42,
    marginBottom: 4,
    opacity: 0.76,
    width: 42,
  },
  tabIconFocused: {
    opacity: 1,
  },
  tabLabel: {
    color: colors.subtext,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  tabLabelFocused: {
    color: "#EAF7FF",
  },
  mainTabsShell: {
    flex: 1,
  },
  profileShortcut: {
    alignItems: "center",
    backgroundColor: "rgba(14,34,59,0.96)",
    borderColor: "#21486A",
    borderRadius: 999,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    position: "absolute",
    right: 14,
    width: 50,
    zIndex: 20,
  },
  headerBackButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    paddingVertical: 4,
  },
  headerBackLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
});
