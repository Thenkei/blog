import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { VitePWA } from "vite-plugin-pwa";

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
      },
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
