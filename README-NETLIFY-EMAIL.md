# StashIt Vault — Netlify Email Autoresponder (Free)

This kit sends an automatic email (and BCC to you) when someone submits your Netlify Forms.

## Files
- `netlify/functions/send-email.js` — serverless function that sends emails via Gmail (Google Workspace)
- `netlify.toml` — config to trigger the function on `submission-created` events
- `package.json` — includes `nodemailer` dependency

## Setup (one-time)
1. **Add these files to your GitHub repo** (same repo as `index.html`). Keep the folder names exactly the same.
2. In **Netlify → Site settings → Environment variables**, add:
   - `GMAIL_USER = info@stashitvault.com`
   - `GMAIL_APP_PASSWORD = <your Gmail App Password>`
   > Create an App Password: Google Account → Security → 2‑Step Verification (enable) → App passwords → App: Mail, Device: Netlify → copy 16‑char password.
3. Commit & push. Netlify will auto-deploy and install `nodemailer` for the function.
4. **Test:** submit either form live. You should receive:
   - An email to the submitter (From: `info@stashitvault.com`)
   - A BCC copy to `info@stashitvault.com`

## Notes
- If a user doesn't enter an email, the function emails only you with the summary.
- Uploaded photos aren’t attached to the email but are counted in the summary. You can view uploads from Netlify → Forms → Submissions (and export).
- You can tailor the message content inside `send-email.js`.
