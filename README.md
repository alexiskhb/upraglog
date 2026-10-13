# upraglog

`upraglog` is a local-first gym workout log built with Vite, React, TypeScript, Tailwind CSS, Dexie, Zustand, TanStack Router, and shadcn/ui.

## Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```

## Versioning

**Reminder:** Bump the patch version for every user-facing change, including UI
fixes, before committing. Update both `package.json` and `package-lock.json`
together so `npm ci` stays consistent.

The version shown in Settings is taken from `package.json` at build time
(`vite.config.ts` injects it as `__APP_VERSION__`), so no separate version
constant needs editing. Run `npm run lint` and `npm run build` when feasible.

## Google Drive Backup

Copy `.env.example` to `.env.local` and replace
`VITE_GOOGLE_DRIVE_CLIENT_ID` with a Google OAuth 2.0 web client ID.
If you download a `client_secret_*.json` file from Google Cloud, only copy the
`client_id` value into `.env.local`; the browser app does not use the client
secret.

In Google Cloud Console, enable the Google Drive API, configure the OAuth
consent screen, and add your app origins such as `http://localhost:5173` and
your production origin to the web client. The app requests only the
`https://www.googleapis.com/auth/drive.appdata` scope and stores
`upraglog-backup.json` in Drive's hidden app data folder.

For GitHub Pages, add a repository variable named
`VITE_GOOGLE_DRIVE_CLIENT_ID` with the same client ID so the CI build embeds it.
You can optionally add `VITE_GOOGLE_DRIVE_BACKUP_FILE_NAME` to override the
default backup filename.

### Google OAuth Verification

The app includes public static pages for Google OAuth brand review:

- `/google-oauth-verification.html`
- `/privacy.html`
- `/terms.html`

Use `docs/google-oauth-verification.md` for the Google Cloud Console checklist,
scope justification, production URLs, and verification video outline. To make
the Drive backup available to all Google users, configure the OAuth consent
screen as `External`, publish it to production, verify the production domain in
Google Search Console, and declare only the
`https://www.googleapis.com/auth/drive.appdata` scope.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` deploys `dist` to GitHub Pages when `main` is pushed.

In the GitHub repository settings:

1. Go to `Settings -> Pages`.
2. Set `Build and deployment -> Source` to `GitHub Actions`.
3. Push to `main` or run the workflow manually.

For a project Pages URL like `https://USER.github.io/upraglog/`, the workflow derives `VITE_BASE_PATH` from the repository name. For a custom domain or user/org Pages repo served at `/`, set a repository variable named `VITE_BASE_PATH` to `/`.

Local Pages build and preview:

```bash
npm run build:pages
npm run preview:pages
```
