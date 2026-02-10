import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const postsDir = path.join(root, "src", "assets", "images", "posts");
const defaultWidths = [960, 1600];

function printUsage() {
  console.log(
    [
      "Usage:",
      "  npm run optimize:image -- --input src/assets/images/posts/example.png",
      "  npm run optimize:image -- --input src/assets/images/posts/example.png --widths 960,1600,2200",
      "  npm run optimize:image -- --input src/assets/images/posts/example.png --quality-avif 55 --quality-webp 72 --quality-jpeg 78",
      "  npm run optimize:image -- --input src/assets/images/posts/example.png --remove-source",
    ].join("\n"),
  );
}

function parseArgs(argv) {
  const options = {
    input: "",
    widths: [...defaultWidths],
    qualityAvif: 55,
    qualityWebp: 72,
    qualityJpeg: 78,
    removeSource: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") {
      options.help = true;
      continue;
    }

    if (token === "--remove-source") {
      options.removeSource = true;
      continue;
    }

    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for ${token}`);
    }

    if (token === "--input") {
      options.input = next;
      i += 1;
      continue;
    }

    if (token === "--widths") {
      const parsed = next
        .split(",")
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((value) => Number.isFinite(value) && value > 0);
      if (parsed.length === 0) {
        throw new Error("Invalid --widths value. Use comma-separated positive integers.");
      }
      options.widths = [...new Set(parsed)].sort((a, b) => a - b);
      i += 1;
      continue;
    }

    if (token === "--quality-avif") {
      options.qualityAvif = Number.parseInt(next, 10);
      i += 1;
      continue;
    }

    if (token === "--quality-webp") {
      options.qualityWebp = Number.parseInt(next, 10);
      i += 1;
      continue;
    }

    if (token === "--quality-jpeg") {
      options.qualityJpeg = Number.parseInt(next, 10);
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  for (const [key, value] of [
    ["quality-avif", options.qualityAvif],
    ["quality-webp", options.qualityWebp],
    ["quality-jpeg", options.qualityJpeg],
  ]) {
    if (!Number.isFinite(value) || value < 1 || value > 100) {
      throw new Error(`Invalid --${key} value: ${value}. Expected 1-100.`);
    }
  }

  return options;
}

function resolveInput(input) {
  if (!input) {
    throw new Error("Missing --input argument.");
  }

  return path.isAbsolute(input) ? input : path.join(root, input);
}

function displayPath(filePath) {
  const relative = path.relative(root, filePath);
  return relative.startsWith("..") ? filePath : relative;
}

function ensureSupportedInput(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const allowed = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);
  if (!allowed.has(ext)) {
    throw new Error(`Unsupported input format: ${ext}`);
  }
}

async function optimize(options) {
  const absoluteInput = resolveInput(options.input);
  ensureSupportedInput(absoluteInput);
  await fs.access(absoluteInput);

  const parsedPath = path.parse(absoluteInput);
  const outputDir = parsedPath.dir;
  const base = parsedPath.name.replace(/-(\d{3,4})$/, "");
  if (base !== parsedPath.name) {
    throw new Error(
      "Input filename already contains a size suffix (e.g. -1600). Use an original source filename instead.",
    );
  }
  const image = sharp(absoluteInput);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions.");
  }

  const writes = [];
  const report = [];

  for (const width of options.widths) {
    const shouldEnlarge = width > metadata.width;
    const actualWidth = shouldEnlarge ? metadata.width : width;
    const resize = sharp(absoluteInput).resize({
      width: actualWidth,
      withoutEnlargement: true,
    });

    const avifPath = path.join(outputDir, `${base}-${width}.avif`);
    const webpPath = path.join(outputDir, `${base}-${width}.webp`);

    writes.push(
      resize.clone().avif({ quality: options.qualityAvif }).toFile(avifPath),
      resize.clone().webp({ quality: options.qualityWebp }).toFile(webpPath),
    );
    report.push(avifPath, webpPath);
  }

  const jpegWidth = options.widths[options.widths.length - 1];
  const jpegPath = path.join(outputDir, `${base}-${jpegWidth}.jpg`);
  writes.push(
    sharp(absoluteInput)
      .resize({ width: jpegWidth, withoutEnlargement: true })
      .jpeg({ quality: options.qualityJpeg, mozjpeg: true })
      .toFile(jpegPath),
  );
  report.push(jpegPath);

  await Promise.all(writes);

  if (options.removeSource) {
    const relative = path.relative(postsDir, absoluteInput);
    if (!relative.startsWith("..")) {
      await fs.unlink(absoluteInput);
      report.push(`removed source: ${absoluteInput}`);
    } else {
      throw new Error("Refusing to remove source outside src/assets/images/posts.");
    }
  }

  console.log("Generated optimized variants:");
  for (const item of report) {
    console.log(`- ${displayPath(item)}`);
  }
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printUsage();
      return;
    }
    await optimize(options);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    printUsage();
    process.exit(1);
  }
}

await main();
