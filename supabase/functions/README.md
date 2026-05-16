Deploy the invite email function after you have created your Supabase project and Resend account.

Required Supabase secrets:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `IOS_APP_INSTALL_URL` (recommended for iPhone / iPad testers)
- `ANDROID_APP_INSTALL_URL` (recommended for Android testers)

Optional fallback:

- `APP_INSTALL_URL` (used only if you do not provide platform-specific install URLs)

Recommended flow:

1. Install the Supabase CLI if you do not already have it.
2. Log in:
   `supabase login`
3. Link this local folder to your Supabase project:
   `supabase link --project-ref <your-project-ref>`
4. Set the secrets:
   `supabase secrets set RESEND_API_KEY=re_xxx`
   `supabase secrets set RESEND_FROM_EMAIL=invites@yourdomain.com`
   `supabase secrets set IOS_APP_INSTALL_URL=https://testflight.apple.com/join/<your-testflight-code>`
   `supabase secrets set ANDROID_APP_INSTALL_URL=https://expo.dev/accounts/<account>/projects/precision-pit/builds/<preview-build-id>`
5. Deploy the function:
   `supabase functions deploy send-team-invite`

After deployment, the app will try to invoke `send-team-invite` whenever the team owner creates an invite.
Text-message invites can also include install help by setting `EXPO_PUBLIC_ANDROID_INSTALL_URL` and `EXPO_PUBLIC_IOS_INSTALL_URL` in your local `.env`.
