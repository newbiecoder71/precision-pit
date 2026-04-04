import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

export const passwordResetRedirectUrl = "precisionpit://reset-password";

function isValidSupabaseUrl(value?: string) {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

const configuredSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const configuredSupabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured =
  isValidSupabaseUrl(configuredSupabaseUrl) && !!configuredSupabasePublishableKey;

export const supabaseConfigDiagnostics = {
  hasUrlValue: !!configuredSupabaseUrl,
  urlLooksValid: isValidSupabaseUrl(configuredSupabaseUrl),
  hasPublishableKey: !!configuredSupabasePublishableKey,
  urlHost: isValidSupabaseUrl(configuredSupabaseUrl)
    ? new URL(configuredSupabaseUrl!).host
    : undefined,
};

export const supabaseUrl = isSupabaseConfigured
  ? configuredSupabaseUrl
  : "https://placeholder.supabase.co";
export const supabasePublishableKey = isSupabaseConfigured
  ? configuredSupabasePublishableKey
  : "placeholder-publishable-key";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function createSessionFromUrl(url: string) {
  const queryString = url.includes("?") ? url.slice(url.indexOf("?") + 1).split("#")[0] : "";
  const fragmentString = url.includes("#") ? url.slice(url.indexOf("#") + 1) : "";
  const paramsString = [queryString, fragmentString].filter(Boolean).join("&");

  if (!paramsString) {
    return false;
  }

  const params = new URLSearchParams(paramsString);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return false;
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw error;
  }

  return true;
}
