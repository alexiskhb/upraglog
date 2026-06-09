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
