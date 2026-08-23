import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_PREFERENCES_KEY = "notificationPreferences";
const PRINT_EXPORT_PREFERENCES_KEY = "printExportPreferences";

export type NotificationPreferences = {
  inviteAlerts: boolean;
  eventReminders: boolean;
  raceDayReminders: boolean;
  updateAnnouncements: boolean;
};

export type PrintExportPreferences = {
  includeWeather: boolean;
  includeTrack: boolean;
  includeResults: boolean;
  includeSetups: boolean;
  includeDriverNotes: boolean;
  includeCrewNotes: boolean;
};

export const defaultNotificationPreferences: NotificationPreferences = {
  inviteAlerts: true,
  eventReminders: true,
  raceDayReminders: true,
  updateAnnouncements: true,
};

export const defaultPrintExportPreferences: PrintExportPreferences = {
  includeWeather: true,
  includeTrack: true,
  includeResults: true,
  includeSetups: true,
  includeDriverNotes: true,
  includeCrewNotes: true,
};

function sanitizeNotificationPreferences(input: unknown): NotificationPreferences {
  if (!input || typeof input !== "object") {
    return defaultNotificationPreferences;
  }

  const value = input as Partial<NotificationPreferences>;
  return {
    inviteAlerts:
      typeof value.inviteAlerts === "boolean"
        ? value.inviteAlerts
        : defaultNotificationPreferences.inviteAlerts,
    eventReminders:
      typeof value.eventReminders === "boolean"
        ? value.eventReminders
        : defaultNotificationPreferences.eventReminders,
    raceDayReminders:
      typeof value.raceDayReminders === "boolean"
        ? value.raceDayReminders
        : defaultNotificationPreferences.raceDayReminders,
    updateAnnouncements:
      typeof value.updateAnnouncements === "boolean"
        ? value.updateAnnouncements
        : defaultNotificationPreferences.updateAnnouncements,
  };
}

function sanitizePrintExportPreferences(input: unknown): PrintExportPreferences {
  if (!input || typeof input !== "object") {
    return defaultPrintExportPreferences;
  }

  const value = input as Partial<PrintExportPreferences>;
  return {
    includeWeather:
      typeof value.includeWeather === "boolean"
        ? value.includeWeather
        : defaultPrintExportPreferences.includeWeather,
    includeTrack:
      typeof value.includeTrack === "boolean"
        ? value.includeTrack
        : defaultPrintExportPreferences.includeTrack,
    includeResults:
      typeof value.includeResults === "boolean"
        ? value.includeResults
        : defaultPrintExportPreferences.includeResults,
    includeSetups:
      typeof value.includeSetups === "boolean"
        ? value.includeSetups
        : defaultPrintExportPreferences.includeSetups,
    includeDriverNotes:
      typeof value.includeDriverNotes === "boolean"
        ? value.includeDriverNotes
        : defaultPrintExportPreferences.includeDriverNotes,
    includeCrewNotes:
      typeof value.includeCrewNotes === "boolean"
        ? value.includeCrewNotes
        : defaultPrintExportPreferences.includeCrewNotes,
  };
}

export async function loadNotificationPreferences() {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
    if (!raw) {
      return defaultNotificationPreferences;
    }

    return sanitizeNotificationPreferences(JSON.parse(raw));
  } catch {
    return defaultNotificationPreferences;
  }
}

export async function saveNotificationPreferences(preferences: NotificationPreferences) {
  await AsyncStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(preferences));
}

export async function loadPrintExportPreferences() {
  try {
    const raw = await AsyncStorage.getItem(PRINT_EXPORT_PREFERENCES_KEY);
    if (!raw) {
      return defaultPrintExportPreferences;
    }

    return sanitizePrintExportPreferences(JSON.parse(raw));
  } catch {
    return defaultPrintExportPreferences;
  }
}

export async function savePrintExportPreferences(preferences: PrintExportPreferences) {
  await AsyncStorage.setItem(PRINT_EXPORT_PREFERENCES_KEY, JSON.stringify(preferences));
}
