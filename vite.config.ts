import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { VitePWA } from "vite-plugin-pwa";

const postModulePattern = /\/content\/posts\/([^/]+)\/(en|fr)\.mdx$/;
const postAssetPath = "src/assets/images/posts/";

export default defineConfig({
  base: "/blog/",
  plugins: [
    mdx({
      providerImportSource: "@mdx-js/react",
      remarkPlugins: [
        remarkFrontmatter,
        [remarkMdxFrontmatter, { name: "meta" }],
        remarkGfm,
      ],
      rehypePlugins: [rehypeSlug],
    }),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt", "sitemap.xml", "rss.xml"],
      manifest: {
        name: "Morgan's Blog",
        short_name: "Blog",
        theme_color: "#ffffff",
        icons: [
          {
            src: "favicon.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,avif,webp,jpg,json}"],
        globIgnores: ["assets/posts/**"],
        runtimeCaching: [
          {
            urlPattern: /\/blog\/assets\/posts\/.*$/,
            handler: "CacheFirst",
            options: {
              cacheName: "post-content",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        chunkFileNames(chunk) {
          const containsPostModule = chunk.moduleIds.some((id) =>
            postModulePattern.test(id),
          );

          return containsPostModule
            ? "assets/posts/[name]-[hash].js"
            : "assets/[name]-[hash].js";
        },
        assetFileNames(asset) {
          if (asset.originalFileNames.some((fileName) => fileName.includes(postAssetPath))) {
            return "assets/posts/[name]-[hash][extname]";
          }

          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 15000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
