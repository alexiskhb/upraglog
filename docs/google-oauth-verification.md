# Google OAuth Verification

Use this checklist when preparing the production Google Cloud project for
Upraglog's optional Google Drive backup.

## App Behavior To Declare

- App name: `Upraglog`
- App type: web app / PWA
- User type: `External`
- Publishing status for all Google users: `In production`
- Requested scope:
  `https://www.googleapis.com/auth/drive.appdata`
- Scope purpose: user-initiated backup and restore of
  `upraglog-backup.json` in Google Drive's hidden `appDataFolder`.
- Why this scope is narrow enough: the app needs Drive's app data folder so it
  can store a private app-owned backup without requesting access to normal
  Drive files.
- Data sharing: no sale of Google user data, no advertising use, no analytics
  provider transfer, and no backend server storage by this app.
- Token handling: OAuth access tokens are used in the browser for the requested
  Drive action and are not persisted by the app.

Google currently documents `drive.appdata` as a recommended, non-sensitive
Drive scope:
https://developers.google.com/workspace/drive/api/guides/api-specific-auth

## Public URLs

Publish the app on its production HTTPS origin before submitting verification.
For GitHub Pages with the default project path, these URLs look like:

- Application home page:
  `https://USER.github.io/upraglog/google-oauth-verification.html`
- Privacy policy:
  `https://USER.github.io/upraglog/privacy.html`
- Terms of service:
  `https://USER.github.io/upraglog/terms.html`

For a custom domain or a different base path, keep the same filenames on that
production origin.

## Google Cloud Console Setup

1. Enable the Google Drive API for the production project.
2. Configure the OAuth consent screen with user type `External`.
3. Set the app name to `Upraglog`.
4. Set the user support email and developer contact email to monitored
   addresses.
5. Add the production domain to Authorized domains.
6. Verify ownership of the top private domain in Google Search Console with a
   Google account that is an owner or editor of the Cloud project.
7. Add the application home page, privacy policy, and terms URLs listed above.
8. Add the app logo from `public/logo-128.png`.
9. On Data Access, add only this scope:
   `https://www.googleapis.com/auth/drive.appdata`.
10. Create or update the OAuth web client:
    - Authorized JavaScript origins: production origin and any development
      origins you use, such as `http://localhost:5173`.
    - Authorized redirect URIs: not used by the current Google Identity Services
      popup token flow.
11. Put the production OAuth web client ID in
    `VITE_GOOGLE_DRIVE_CLIENT_ID`.
12. For all users, publish the OAuth app to production after required
    verification is approved or not required by the console.

Official Google verification guidance:

- Brand verification:
  https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
- Sensitive scope verification:
  https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification
- OAuth app verification Help Center:
  https://support.google.com/cloud/answer/13463073

## Verification Form Copy

Use this when Google asks for scope justification:

> Upraglog uses `https://www.googleapis.com/auth/drive.appdata` only for
> optional, user-initiated backup and restore. When a user clicks "Backup to
> Drive", the app writes a JSON backup file named `upraglog-backup.json` to the
> user's Google Drive app data folder. When a user clicks "Restore From Drive",
> the app reads that same app-owned backup file and imports it into the local
> browser database. The app does not request broad Drive access and does not
> read, list, modify, or delete the user's normal Drive files.

If Google asks for a demonstration video, show:

1. The production app URL in the browser address bar.
2. Opening Settings.
3. Clicking "Backup to Drive".
4. The OAuth consent screen showing the `Upraglog` app name and the production
   OAuth client.
5. Granting consent.
6. The successful backup message in Upraglog.
7. Clicking "Restore From Drive" and showing the restore confirmation flow.

## Local Checks

Run these before submitting:

```bash
npm run lint
npm run build
```

Then check the built files or deployed site:

- `/google-oauth-verification.html`
- `/privacy.html`
- `/terms.html`
- `/`
