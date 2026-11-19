import React from "react";
import {
  Alert,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput as RNTextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppPressable from "../components/AppPressable";
import TextInput from "../components/AppTextInput";
import KeyboardScreen from "../components/KeyboardScreen";
import {
  BIOMETRIC_CREDENTIALS_KEY,
  BIOMETRIC_ENABLED_KEY,
} from "../constants/authPreferences";
import {
  getRaceCarTypeOptions,
  getRacingTypeOptions,
  trackTypeOptions,
} from "../data/racing";
import { colors, spacing } from "../theme";
import { defaultTeamMemberPermissions, useAppStore } from "../store/useAppStore";

const ACCOUNT_SETTINGS_TOOLTIP_KEY = "hasSeenAccountSettingsTooltip";

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "Not set"}</Text>
    </View>
  );
}

export default function AccountScreen({ navigation, route }: any) {
  const scrollRef = React.useRef<KeyboardAwareScrollView>(null);
  const transponderInputRef = React.useRef<React.ElementRef<typeof RNTextInput>>(null);
  const insets = useSafeAreaInsets();
  const userName = useAppStore((state) => state.userName);
  const teamName = useAppStore((state) => state.teamName);
  const userEmail = useAppStore((state) => state.userEmail);
  const transponderNumber = useAppStore((state) => state.transponderNumber);
  const racingType = useAppStore((state) => state.racingType);
  const raceCarType = useAppStore((state) => state.raceCarType);
  const carClass = useAppStore((state) => state.carClass);
  const engineType = useAppStore((state) => state.engineType);
  const fuelType = useAppStore((state) => state.fuelType);
  const carburetorType = useAppStore((state) => state.carburetorType);
  const driverName = useAppStore((state) => state.driverName);
  const crewChiefName = useAppStore((state) => state.crewChiefName);
  const brandingPreferences = useAppStore((state) => state.brandingPreferences);
  const isTeamOwner = useAppStore((state) => state.isTeamOwner);
  const userId = useAppStore((state) => state.userId);
  const currentTeamRole = useAppStore((state) => state.currentTeamRole);
  const teamMembers = useAppStore((state) => state.teamMembers);
  const refreshTeamData = useAppStore((state) => state.refreshTeamData);
  const saveProfile = useAppStore((state) => state.saveProfile);
  const saveBrandingPreferences = useAppStore((state) => state.saveBrandingPreferences);
  const signOut = useAppStore((state) => state.signOut);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [biometricAvailable, setBiometricAvailable] = React.useState(false);
  const [showSettingsTooltip, setShowSettingsTooltip] = React.useState(false);
  const [showTeamDetails, setShowTeamDetails] = React.useState(false);
  const [isEditingTeamDetails, setIsEditingTeamDetails] = React.useState(false);
  const [isEditingBranding, setIsEditingBranding] = React.useState(false);
  const [isEditingTransponder, setIsEditingTransponder] = React.useState(false);
  const [draftDriverName, setDraftDriverName] = React.useState(driverName ?? "");
  const [draftCrewChiefName, setDraftCrewChiefName] = React.useState(crewChiefName ?? "");
  const [draftTrackType, setDraftTrackType] = React.useState(racingType ?? "");
  const [draftRacingType, setDraftRacingType] = React.useState(raceCarType ?? "");
  const [draftCarClass, setDraftCarClass] = React.useState(carClass ?? "");
  const [draftEngineType, setDraftEngineType] = React.useState(engineType ?? "");
  const [draftFuelType, setDraftFuelType] = React.useState(fuelType ?? "");
  const [draftCarburetorType, setDraftCarburetorType] = React.useState(carburetorType ?? "");
  const [draftTransponderNumber, setDraftTransponderNumber] = React.useState(transponderNumber ?? "");
  const [draftCarNumberText, setDraftCarNumberText] = React.useState(brandingPreferences.carNumberText ?? "");
  const [draftCarNumberImageUri, setDraftCarNumberImageUri] = React.useState(
    brandingPreferences.carNumberImageUri ?? "",
  );
  const [showTrackTypeMenu, setShowTrackTypeMenu] = React.useState(false);
  const [showRacingTypeMenu, setShowRacingTypeMenu] = React.useState(false);
  const [showCarClassMenu, setShowCarClassMenu] = React.useState(false);

  const availableRacingTypes = getRacingTypeOptions(draftTrackType);
  const availableCarClasses = getRaceCarTypeOptions(draftRacingType);
  const rosterRole = React.useMemo(
    () => teamMembers.find((member) => member.userId === userId)?.role,
    [teamMembers, userId],
  );
  const currentMemberPermissions = React.useMemo(
    () =>
      teamMembers.find((member) => member.userId === userId)?.permissions ??
      defaultTeamMemberPermissions,
    [teamMembers, userId],
  );
  const displayRole = rosterRole ?? currentTeamRole ?? (isTeamOwner ? "Owner" : "Crew");
  const roleLabel = displayRole === "Crew" ? "Crew Member" : displayRole;
  const isStackAccountView = route?.name === "AccountProfile";
  const canEditTeamDetails = isTeamOwner || currentMemberPermissions.editTeamDetails;
  const canEditTeamBranding = isTeamOwner || currentMemberPermissions.editTeamBranding;
  const canEditTransponder =
    isTeamOwner || (displayRole === "Crew Chief" && currentMemberPermissions.editTeamDetails);

  React.useEffect(() => {
    setDraftDriverName(driverName ?? "");
    setDraftCrewChiefName(crewChiefName ?? "");
    setDraftTrackType(racingType ?? "");
    setDraftRacingType(raceCarType ?? "");
    setDraftCarClass(carClass ?? "");
    setDraftEngineType(engineType ?? "");
    setDraftFuelType(fuelType ?? "");
    setDraftCarburetorType(carburetorType ?? "");
  }, [driverName, crewChiefName, racingType, raceCarType, carClass, engineType, fuelType, carburetorType]);

  React.useEffect(() => {
    setDraftCarNumberText(brandingPreferences.carNumberText ?? "");
    setDraftCarNumberImageUri(brandingPreferences.carNumberImageUri ?? "");
  }, [brandingPreferences.carNumberImageUri, brandingPreferences.carNumberText]);

  React.useEffect(() => {
    setDraftTransponderNumber(transponderNumber ?? "");
  }, [transponderNumber]);

  React.useEffect(() => {
    let isMounted = true;

    const loadBiometricState = async () => {
      try {
        const enabled = (await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY)) === "true";
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!isMounted) {
          return;
        }

        setBiometricEnabled(enabled);
        setBiometricAvailable(hasHardware && isEnrolled);
      } catch {
        if (isMounted) {
          setBiometricEnabled(false);
          setBiometricAvailable(false);
        }
      }
    };

    void loadBiometricState();
    void (async () => {
      try {
        const hasSeenTooltip = (await AsyncStorage.getItem(ACCOUNT_SETTINGS_TOOLTIP_KEY)) === "true";

        if (!isMounted) {
          return;
        }

        setShowSettingsTooltip(!hasSeenTooltip);
      } catch {
        if (isMounted) {
          setShowSettingsTooltip(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void refreshTeamData().catch((error) => {
        console.warn("Unable to refresh account team data.", error);
      });

      const timeout = setTimeout(() => {
        scrollRef.current?.scrollToPosition?.(0, 0, false);
      }, 0);

      return () => clearTimeout(timeout);
    }, [refreshTeamData]),
  );

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to log out.";
      Alert.alert("Log out failed", message);
    }
  };

  const handleBiometricToggle = async (nextValue: boolean) => {
    if (nextValue) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setBiometricAvailable(false);
        Alert.alert(
          "Fingerprint unavailable",
          "This device does not have fingerprint login set up yet. Add a fingerprint in the device settings first.",
        );
        return;
      }

      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
      setBiometricAvailable(true);
      setBiometricEnabled(true);

      const savedCredentials = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      if (!savedCredentials) {
        Alert.alert(
          "Fingerprint ready",
          "Fingerprint login is turned on. After your next password login, the app will save your secure login so the fingerprint button can appear on the login screen.",
        );
      }

      return;
    }

    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "false");
    await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    setBiometricEnabled(false);
  };

  const handleDismissSettingsTooltip = async () => {
    setShowSettingsTooltip(false);

    try {
      await AsyncStorage.setItem(ACCOUNT_SETTINGS_TOOLTIP_KEY, "true");
    } catch (error) {
      console.warn("Unable to save account settings tooltip preference.", error);
    }
  };

  const closeMenus = () => {
    setShowTrackTypeMenu(false);
    setShowRacingTypeMenu(false);
    setShowCarClassMenu(false);
  };

  const resetDraftTeamDetails = () => {
    setDraftDriverName(driverName ?? "");
    setDraftCrewChiefName(crewChiefName ?? "");
    setDraftTrackType(racingType ?? "");
    setDraftRacingType(raceCarType ?? "");
    setDraftCarClass(carClass ?? "");
    setDraftEngineType(engineType ?? "");
    setDraftFuelType(fuelType ?? "");
    setDraftCarburetorType(carburetorType ?? "");
    closeMenus();
  };

  const handleToggleEdit = () => {
    setShowTeamDetails(true);

    if (isEditingTeamDetails) {
      resetDraftTeamDetails();
      setIsEditingTeamDetails(false);
      Keyboard.dismiss();
      return;
    }

    setIsEditingTeamDetails(true);
  };

  const handleSaveTeamDetails = async () => {
    try {
      await saveProfile(
        teamName,
        userName,
        draftTrackType,
        draftRacingType,
        draftCarClass,
        draftDriverName,
        draftCrewChiefName,
        draftEngineType,
        draftFuelType,
        draftCarburetorType,
      );
      closeMenus();
      setIsEditingTeamDetails(false);
      Keyboard.dismiss();
      Alert.alert("Saved", "Account details were saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save changes.";
      Alert.alert("Save failed", message);
    }
  };

  const resetDraftBranding = () => {
    setDraftCarNumberText(brandingPreferences.carNumberText ?? "");
    setDraftCarNumberImageUri(brandingPreferences.carNumberImageUri ?? "");
  };

  const handleToggleBrandingEdit = () => {
    if (isEditingBranding) {
      resetDraftBranding();
      setIsEditingBranding(false);
      Keyboard.dismiss();
      return;
    }

    setIsEditingBranding(true);
  };

  const handlePickCarNumberImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Photo Access Needed",
          "Allow photo library access so you can upload your car number image.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets.length) {
        return;
      }

      setDraftCarNumberImageUri(result.assets[0].uri);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to open the photo library.";
      Alert.alert("Image failed", message);
    }
  };

  const handleSaveBranding = async () => {
    try {
      await saveBrandingPreferences({
        carNumberText: draftCarNumberText.trim(),
        carNumberImageUri: draftCarNumberImageUri.trim(),
      });
      setIsEditingBranding(false);
      Keyboard.dismiss();
      Alert.alert("Saved", "Team branding was saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save team branding.";
      Alert.alert("Save failed", message);
    }
  };

  const handleToggleTransponderEdit = () => {
    if (isEditingTransponder) {
      setDraftTransponderNumber(transponderNumber ?? "");
      setIsEditingTransponder(false);
      Keyboard.dismiss();
      return;
    }

    setIsEditingTransponder(true);
  };

  const handleSaveTransponderNumber = async () => {
    try {
      await saveProfile(
        teamName,
        userName,
        racingType,
        raceCarType,
        carClass,
        driverName,
        crewChiefName,
        engineType,
        fuelType,
        carburetorType,
        draftTransponderNumber.replace(/[^0-9A-Za-z-]/g, ""),
      );
      setIsEditingTransponder(false);
      Keyboard.dismiss();
      Alert.alert("Saved", "Transponder number was saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save transponder number.";
      Alert.alert("Save failed", message);
    }
  };

  const renderDropdown = (
    label: string,
    value: string,
    placeholder: string,
    visible: boolean,
    onToggle: () => void,
    options: string[],
    onSelect: (option: string) => void,
    disabled?: boolean,
  ) => (
    <>
      <Pressable onPress={Keyboard.dismiss}>
        <Text style={styles.editLabel}>{label}</Text>
      </Pressable>
      <View style={styles.dropdownWrap}>
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            if (disabled) {
              return;
            }
            onToggle();
          }}
          style={[styles.dropdownButton, disabled ? styles.dropdownButtonDisabled : undefined]}
        >
          <Text style={value ? styles.dropdownValue : styles.dropdownPlaceholder}>
            {value || placeholder}
          </Text>
          <Text style={styles.dropdownCaret}>{visible && !disabled ? "^" : "v"}</Text>
        </Pressable>

        {visible ? (
          <View style={styles.menu}>
            {options.map((option) => (
              <Pressable
                key={option}
                onPress={() => onSelect(option)}
                style={[styles.menuItem, value === option ? styles.menuItemActive : undefined]}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    value === option ? styles.menuItemTextActive : undefined,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </>
  );

  return (
    <KeyboardScreen
      scrollRef={scrollRef}
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom:
            spacing(2) + insets.bottom + (isStackAccountView ? 56 : 24),
        },
      ]}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag"
    >
      <Image
        source={require("../../assets/icons/account.png")}
        style={[styles.bannerImage, isStackAccountView ? styles.bannerImageStack : undefined]}
        resizeMode="contain"
      />

      {showSettingsTooltip ? (
        <View style={styles.tooltipCard}>
          <Text style={styles.tooltipTitle}>Update Account Info</Text>
          <Text style={styles.tooltipBody}>
            To edit this team information, use the Edit link in the Team Setup Details card below.
          </Text>
          <AppPressable onPress={() => void handleDismissSettingsTooltip()} style={styles.tooltipButton}>
            <Text style={styles.tooltipButtonText}>Got It</Text>
          </AppPressable>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Team</Text>
        <Text style={styles.value}>{teamName || "Not set"}</Text>

        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.value}>{userName || "Driver profile not set"}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{userEmail || "No email on file"}</Text>

        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{roleLabel}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Transponder Number</Text>
        </View>
        {canEditTransponder ? (
          <View style={styles.sectionHeaderRow}>
            <Pressable onPress={handleToggleTransponderEdit} hitSlop={8}>
              <Text style={styles.editLink}>{isEditingTransponder ? "Cancel" : "Edit"}</Text>
            </Pressable>
          </View>
        ) : null}
        {!isEditingTransponder ? (
          <>
            <Text style={styles.value}>{transponderNumber || "Not set"}</Text>
            {!canEditTransponder ? (
              <Text style={styles.helperText}>
                Only the team owner or an approved crew chief can change the team transponder number.
              </Text>
            ) : null}
          </>
        ) : (
          <Pressable onPress={Keyboard.dismiss}>
            <View style={styles.transponderFieldWrap}>
              <RNTextInput
                ref={transponderInputRef}
                style={styles.input}
                placeholder="Enter transponder number"
                placeholderTextColor="#4F7390"
                value={draftTransponderNumber}
                onChangeText={(value) => setDraftTransponderNumber(value.replace(/[^0-9A-Za-z-]/g, ""))}
              />
            </View>
            <AppPressable onPress={() => void handleSaveTransponderNumber()} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save Transponder Number</Text>
            </AppPressable>
          </Pressable>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <AppPressable
            onPress={() => {
              if (isEditingTeamDetails) {
                return;
              }
              setShowTeamDetails((current) => !current);
            }}
            style={styles.teamDetailsButton}
          >
            <Text style={styles.teamDetailsButtonText}>
              {showTeamDetails || isEditingTeamDetails ? "Hide Team Details" : "Team Details"}
            </Text>
          </AppPressable>
        </View>
        {canEditTeamDetails && (showTeamDetails || isEditingTeamDetails) ? (
          <View style={styles.sectionHeaderRow}>
            <Pressable onPress={handleToggleEdit} hitSlop={8}>
              <Text style={styles.editLink}>{isEditingTeamDetails ? "Cancel" : "Edit"}</Text>
            </Pressable>
          </View>
        ) : null}

        {showTeamDetails || isEditingTeamDetails ? (
          !isEditingTeamDetails ? (
            <>
              <InfoRow label="Track Type" value={racingType || ""} />
              <InfoRow label="Racing Type" value={raceCarType || ""} />
              <InfoRow label="Car Class" value={carClass || ""} />
              <InfoRow label="Engine Type" value={engineType || ""} />
              <InfoRow label="Fuel Type" value={fuelType || ""} />
              <InfoRow label="Carburetor Type" value={carburetorType || ""} />
              <InfoRow label="Driver" value={driverName || ""} />
              <InfoRow label="Crew Chief" value={crewChiefName || ""} />
            </>
          ) : (
            <Pressable onPress={Keyboard.dismiss}>
              {renderDropdown(
                "Track Type",
                draftTrackType,
                "Select track type",
                showTrackTypeMenu,
                () => {
                  setShowTrackTypeMenu((current) => !current);
                  setShowRacingTypeMenu(false);
                  setShowCarClassMenu(false);
                },
                trackTypeOptions,
                (option) => {
                  setDraftTrackType(option);
                  setDraftRacingType("");
                  setDraftCarClass("");
                  setShowTrackTypeMenu(false);
                },
              )}

              {renderDropdown(
                "Racing Type",
                draftRacingType,
                availableRacingTypes.length > 0 ? "Select racing type" : "Choose track type first",
                showRacingTypeMenu,
                () => {
                  setShowRacingTypeMenu((current) => !current);
                  setShowTrackTypeMenu(false);
                  setShowCarClassMenu(false);
                },
                availableRacingTypes,
                (option) => {
                  setDraftRacingType(option);
                  setDraftCarClass("");
                  setShowRacingTypeMenu(false);
                },
                availableRacingTypes.length === 0,
              )}

              {renderDropdown(
                "Car Class",
                draftCarClass,
                availableCarClasses.length > 0 ? "Select car class" : "Choose racing type first",
                showCarClassMenu,
                () => {
                  setShowCarClassMenu((current) => !current);
                  setShowTrackTypeMenu(false);
                  setShowRacingTypeMenu(false);
                },
                availableCarClasses,
                (option) => {
                  setDraftCarClass(option);
                  setShowCarClassMenu(false);
                },
                availableCarClasses.length === 0,
              )}

              <Text style={styles.helper}>
                Track Type, Racing Type, and Car Class shape the setup logic shown across the app.
              </Text>

              <Text style={styles.editLabel}>Engine Type</Text>
              <TextInput
                style={styles.input}
                placeholder="GM 602 crate"
                placeholderTextColor="#4F7390"
                value={draftEngineType}
                onChangeText={setDraftEngineType}
              />

              <Text style={styles.editLabel}>Fuel Type</Text>
              <TextInput
                style={styles.input}
                placeholder="Methanol"
                placeholderTextColor="#4F7390"
                value={draftFuelType}
                onChangeText={setDraftFuelType}
              />

              <Text style={styles.editLabel}>Carburetor Type</Text>
              <TextInput
                style={styles.input}
                placeholder="2 barrel Rochester"
                placeholderTextColor="#4F7390"
                value={draftCarburetorType}
                onChangeText={setDraftCarburetorType}
              />

              <Text style={styles.editLabel}>Driver</Text>
              <TextInput
                style={styles.input}
                placeholder="Driver name"
                placeholderTextColor="#4F7390"
                value={draftDriverName}
                onChangeText={setDraftDriverName}
              />

              <Text style={styles.editLabel}>Crew Chief</Text>
              <TextInput
                style={styles.input}
                placeholder="Crew chief name"
                placeholderTextColor="#4F7390"
                value={draftCrewChiefName}
                onChangeText={setDraftCrewChiefName}
              />

              <AppPressable onPress={() => void handleSaveTeamDetails()} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </AppPressable>
            </Pressable>
          )
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Team Branding</Text>
        </View>
        {canEditTeamBranding ? (
          <View style={styles.sectionHeaderRow}>
            <Pressable onPress={handleToggleBrandingEdit} hitSlop={8}>
              <Text style={styles.editLink}>{isEditingBranding ? "Cancel" : "Edit"}</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.brandingPreviewWrap}>
          <Text style={styles.infoLabel}>Car Number Badge Preview</Text>
          <View style={styles.brandingBadge}>
            <View style={styles.brandingBadgeInner}>
              {draftCarNumberImageUri.trim() ? (
                <Image
                  source={{ uri: draftCarNumberImageUri }}
                  style={styles.brandingBadgeImage}
                  resizeMode="contain"
                />
              ) : draftCarNumberText.trim() ? (
                <Text style={styles.brandingBadgeText}>{draftCarNumberText.trim()}</Text>
              ) : (
                <Text style={styles.brandingEmptyText}>No car number set yet</Text>
              )}
            </View>
          </View>
        </View>

        {isEditingBranding ? (
          <Pressable onPress={Keyboard.dismiss}>
            <Text style={styles.editLabel}>Car Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Type car number"
              placeholderTextColor="#4F7390"
              value={draftCarNumberText}
              onChangeText={setDraftCarNumberText}
            />
            <Text style={styles.helper}>
              Type your team car number here, or upload the graphics file if your designer already made one.
            </Text>

            <AppPressable onPress={() => void handlePickCarNumberImage()} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                {draftCarNumberImageUri.trim() ? "Replace Car Number Image" : "Upload Car Number Image"}
              </Text>
            </AppPressable>

            {draftCarNumberImageUri.trim() ? (
              <Pressable
                onPress={() => {
                  setDraftCarNumberImageUri("");
                }}
                hitSlop={8}
              >
                <Text style={styles.editLink}>Clear Uploaded Image</Text>
              </Pressable>
            ) : null}

            <AppPressable onPress={() => void handleSaveBranding()} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save Team Branding</Text>
            </AppPressable>
          </Pressable>
        ) : (
          <Text style={styles.helper}>
            Add a typed car number or upload a custom car-number image to show a styled team badge on the home dashboard.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <AppPressable onPress={() => navigation.navigate("TeamMembers")} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>View Team Members</Text>
        </AppPressable>

        <AppPressable onPress={() => navigation.navigate("SavedTracks")} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Saved Tracks</Text>
        </AppPressable>

        <View style={styles.preferenceCard}>
          <View style={styles.preferenceCopy}>
            <Text style={styles.preferenceTitle}>Fingerprint Login</Text>
            <Text style={styles.preferenceBody}>
              {biometricAvailable
                ? "Use your saved fingerprint to get back into the app faster."
                : "Turn this on after fingerprint is set up in your device settings."}
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={(value) => {
              void handleBiometricToggle(value);
            }}
            trackColor={{ false: "#21486A", true: "#39B4FF" }}
            thumbColor={biometricEnabled ? "#F3FAFF" : "#9AB7CC"}
          />
        </View>

        <AppPressable
          onPress={handleSignOut}
          style={[styles.logoutButton, isStackAccountView ? styles.logoutButtonStack : undefined]}
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </AppPressable>
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing(1),
    paddingTop: spacing(0.5),
    gap: spacing(1),
  },
  bannerImage: {
    alignSelf: "center",
    height: 220,
    width: "100%",
    marginBottom: spacing(0.25),
    marginTop: 30,
  },
  bannerImageStack: {
    marginTop: 10,
  },
  tooltipCard: {
    backgroundColor: "#102947",
    borderColor: "#1E5B94",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1.25),
  },
  tooltipTitle: {
    color: "#8ED4FF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.75,
    marginBottom: spacing(0.5),
    textAlign: "center",
    textTransform: "uppercase",
  },
  tooltipBody: {
    color: "#CBE7FA",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  tooltipButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#1780D4",
    borderRadius: 999,
    marginTop: spacing(1),
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(0.75),
  },
  tooltipButtonText: {
    color: "#F3FAFF",
    fontSize: 14,
    fontWeight: "800",
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1.5),
  },
  label: {
    color: "#8ED4FF",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: spacing(0.15),
    textTransform: "uppercase",
    letterSpacing: 0.75,
    textAlign: "center",
  },
  value: {
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing(1),
    textAlign: "center",
  },
  sectionHeaderRow: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing(0.75),
  },
  teamDetailsButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#5AB3FF",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing(2),
  },
  teamDetailsButtonText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  sectionTitle: {
    color: "#EAF7FF",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  editLink: {
    color: "#5AB3FF",
    fontSize: 15,
    fontWeight: "700",
    marginTop: spacing(0.25),
    textAlign: "center",
    textDecorationLine: "underline",
  },
  infoRow: {
    alignItems: "center",
    borderTopColor: "rgba(90,179,255,0.12)",
    borderTopWidth: 1,
    paddingVertical: spacing(0.7),
  },
  infoLabel: {
    color: "#8ED4FF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.75,
    marginBottom: spacing(0.2),
    textAlign: "center",
    textTransform: "uppercase",
  },
  infoValue: {
    color: "#EAF7FF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  editLabel: {
    color: "#8ED4FF",
    fontSize: 17,
    marginBottom: 8,
    textAlign: "center",
  },
  dropdownWrap: {
    marginBottom: 18,
  },
  dropdownButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "#21486A",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownButtonDisabled: {
    opacity: 0.65,
  },
  dropdownValue: {
    color: "#F3FAFF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  dropdownPlaceholder: {
    color: "#6C8CA5",
    fontSize: 17,
    textAlign: "center",
  },
  dropdownCaret: {
    color: "#8ED4FF",
    fontSize: 14,
    fontWeight: "800",
  },
  menu: {
    backgroundColor: "#0E223B",
    borderWidth: 1,
    borderColor: "#21486A",
    borderRadius: 16,
    marginTop: 8,
    overflow: "hidden",
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: "rgba(33,72,106,0.55)",
  },
  menuItemActive: {
    backgroundColor: "#1780D4",
  },
  menuItemText: {
    color: "#A9C7DD",
    fontSize: 15,
    fontWeight: "700",
  },
  menuItemTextActive: {
    color: "#F3FAFF",
  },
  helper: {
    color: "#87AFCB",
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
    marginBottom: 18,
    textAlign: "center",
  },
  brandingPreviewWrap: {
    alignItems: "center",
    marginBottom: spacing(1),
  },
  brandingBadge: {
    borderColor: "rgba(142,212,255,0.24)",
    borderRadius: 22,
    borderWidth: 1,
    marginTop: spacing(0.35),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  brandingBadgeInner: {
    alignItems: "center",
    backgroundColor: "#0B1723",
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 92,
    minWidth: 132,
    paddingHorizontal: spacing(1),
    paddingVertical: spacing(0.85),
  },
  brandingBadgeImage: {
    height: 76,
    width: 108,
  },
  brandingBadgeText: {
    color: "#F7FCFF",
    fontSize: 38,
    fontStyle: "italic",
    fontWeight: "900",
    letterSpacing: 0.6,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  brandingEmptyText: {
    color: "#7FAAC9",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  transponderFieldWrap: {
    marginBottom: spacing(1),
  },
  helperText: {
    color: "#7FAAC9",
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing(0.35),
  },
  input: {
    backgroundColor: colors.card,
    color: "#EAF7FF",
    fontSize: 20,
    borderWidth: 1,
    borderColor: "#21486A",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  saveButton: {
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#5AB3FF",
    marginTop: spacing(0.25),
    paddingVertical: 16,
  },
  saveButtonText: {
    color: colors.bg,
    fontSize: 17,
    fontWeight: "900",
  },
  primaryButton: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 999,
    backgroundColor: "#1780D4",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#F3FAFF",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.bg,
    borderColor: "#5AB3FF",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: spacing(1.5),
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#5AB3FF",
    fontSize: 14,
    fontWeight: "800",
  },
  preferenceCard: {
    alignItems: "center",
    backgroundColor: "#102435",
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing(1),
    justifyContent: "space-between",
    marginTop: spacing(1),
    paddingHorizontal: spacing(1.1),
    paddingVertical: spacing(1),
  },
  preferenceCopy: {
    flex: 1,
    paddingRight: spacing(0.5),
  },
  preferenceTitle: {
    color: "#EAF7FF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: spacing(0.2),
  },
  preferenceBody: {
    color: "#A9C7DD",
    fontSize: 13,
    lineHeight: 19,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: colors.bg,
    borderColor: "#5AB3FF",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: spacing(1.5),
    paddingVertical: 14,
  },
  logoutButtonStack: {
    marginBottom: spacing(5),
  },
  logoutButtonText: {
    color: "#5AB3FF",
    fontSize: 16,
    fontWeight: "800",
  },
});
