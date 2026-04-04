import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type InvitePayload = {
  inviteId: string;
};

type InviteLookup = {
  id: string;
  email: string;
  token: string;
  teams: {
    name: string;
  } | null;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization token." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL");
    const emailLogoUrl = Deno.env.get("EMAIL_LOGO_URL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!resendApiKey || !resendFromEmail || !supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Edge Function secrets for Resend or Supabase.");
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const jwt = authHeader.replace("Bearer ", "").trim();
    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized request." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await request.json()) as InvitePayload;

    if (!payload.inviteId) {
      return new Response(JSON.stringify({ error: "Missing inviteId." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: invite, error: inviteError } = await adminClient
      .from("invites")
      .select("id, email, token, teams(name)")
      .eq("id", payload.inviteId)
      .eq("invited_by_user_id", user.id)
      .maybeSingle<InviteLookup>();

    if (inviteError) {
      throw inviteError;
    }

    if (!invite) {
      return new Response(JSON.stringify({ error: "Invite not found." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const teamName = invite.teams?.name || "Precision Pit";
    const acceptPath = `precisionpit://accept-invite?email=${encodeURIComponent(invite.email)}&token=${encodeURIComponent(invite.token)}&teamName=${encodeURIComponent(teamName)}`;
    const inviterEmail = user.email || "your team owner";
    const logoHtml = emailLogoUrl
      ? `
            <div style="text-align: center; margin-bottom: 20px;">
              <img
                src="${emailLogoUrl}"
                alt="Precision Pit"
                width="96"
                height="96"
                style="display: inline-block; width: 96px; height: 96px; object-fit: contain;"
              />
            </div>
        `
      : "";

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: invite.email,
        subject: `You're invited to join ${teamName} on Precision Pit`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #10243B;">
            ${logoHtml}
            <h2 style="color: #0D2B4F;">Precision Pit Team Invite</h2>
            <p>${inviterEmail} invited you to join <strong>${teamName}</strong> on Precision Pit.</p>
            <p>Open Precision Pit on your phone and tap <strong>Join Team</strong>, then use this email address:</p>
            <p style="font-size: 16px;"><strong>${invite.email}</strong></p>
            <p>If your phone supports app links, you can also try this invite link:</p>
            <p><a href="${acceptPath}">${acceptPath}</a></p>
            <p style="margin-top: 24px; color: #4C6784;">If the app link does not open directly yet, launch the app manually and choose Join Team from the login flow.</p>
          </div>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      throw new Error(`Resend error: ${resendError}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
