import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");

async function main() {
  const indexHtml = path.join(distDir, "index.html");
  const notFoundHtml = path.join(distDir, "404.html");
  await fs.copyFile(indexHtml, notFoundHtml);
  console.log("Generated dist/404.html fallback");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
