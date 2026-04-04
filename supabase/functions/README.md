Deploy the invite email function after you have created your Supabase project and Resend account.

Required Supabase secrets:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Recommended flow:

1. Install the Supabase CLI if you do not already have it.
2. Log in:
   `supabase login`
3. Link this local folder to your Supabase project:
   `supabase link --project-ref <your-project-ref>`
4. Set the secrets:
   `supabase secrets set RESEND_API_KEY=re_xxx`
   `supabase secrets set RESEND_FROM_EMAIL=invites@yourdomain.com`
5. Deploy the function:
   `supabase functions deploy send-team-invite`

After deployment, the app will try to invoke `send-team-invite` whenever the team owner creates an invite.
