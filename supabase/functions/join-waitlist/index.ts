import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type WaitlistPayload = {
  fullName?: string;
  email?: string;
  teamName?: string;
  platformPreference?: string;
  notes?: string;
  website?: string;
};

const allowedPlatforms = new Set(["iPhone", "Android", "Either"]);

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase Edge Function secrets.");
    }

    const payload = (await request.json()) as WaitlistPayload;
    const fullName = payload.fullName?.trim() ?? "";
    const email = payload.email?.trim().toLowerCase() ?? "";
    const teamName = payload.teamName?.trim() ?? "";
    const notes = payload.notes?.trim() ?? "";
    const website = payload.website?.trim() ?? "";
    const platformPreference = allowedPlatforms.has(payload.platformPreference ?? "")
      ? (payload.platformPreference as "iPhone" | "Android" | "Either")
      : "Either";

    if (website) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Enter a valid email address." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { error } = await adminClient.from("waitlist_signups").upsert(
      {
        email,
        full_name: fullName || null,
        team_name: teamName || null,
        platform_preference: platformPreference,
        notes: notes || null,
        source: "website",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "You are on the Precision Pit waiting list.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
