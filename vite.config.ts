import { copyFileSync, readFileSync, writeFileSync } from "node:fs"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import { VitePWA } from "vite-plugin-pwa"

function normalizeBasePath(basePath: string) {
  if (!basePath || basePath === "/") {
    return "/"
  }

  const withLeadingSlash = basePath.startsWith("/") ? basePath : `/${basePath}`
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`
}

function githubPagesFallback(): Plugin {
  return {
    name: "github-pages-fallback",
    apply: "build",
    closeBundle() {
      const distDir = path.resolve(__dirname, "dist")

      copyFileSync(
        path.join(distDir, "index.html"),
        path.join(distDir, "404.html"),
      )
      writeFileSync(path.join(distDir, ".nojekyll"), "")
    },
  }
}

const basePath = normalizeBasePath(process.env.VITE_BASE_PATH ?? "/")
const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version?: string }

export default defineConfig({
  base: basePath,
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version ?? "0.0.0"),
  },
  plugins: [
    react(),
    tailwindcss(),
    githubPagesFallback(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons.svg", "logo.svg"],
      manifest: {
        name: "Upraglog",
        short_name: "Upraglog",
        description: "Local-first gym workout logbook.",
        theme_color: "#090b0d",
        background_color: "#090b0d",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: `${basePath}favicon.svg`,
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: `${basePath}index.html`,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
