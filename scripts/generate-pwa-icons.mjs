/**
 * Generates PWA / favicon PNGs from SVG sources.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const iconsDir = path.join(root, "public", "icons");
const appDir = path.join(root, "src", "app");

const standardSvg = path.join(root, "public", "brand", "icon.svg");
const maskableSvg = path.join(root, "public", "brand", "icon-maskable.svg");

const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 384, 512];

fs.mkdirSync(iconsDir, { recursive: true });

const standardBuffer = fs.readFileSync(standardSvg);
const maskableBuffer = fs.readFileSync(maskableSvg);

for (const size of sizes) {
    await sharp(standardBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, `icon-${size}.png`));
    console.log(`icon-${size}.png`);
}

await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-maskable-512.png"));
console.log("icon-maskable-512.png");

await sharp(standardBuffer).resize(32, 32).png().toFile(path.join(iconsDir, "favicon.png"));
await sharp(standardBuffer)
    .resize(48, 48)
    .png()
    .toBuffer()
    .then((buf) => {
        const icoPath = path.join(iconsDir, "favicon.ico");
        return sharp(buf).toFile(icoPath);
    });

const appCopies = [
    { from: 32, name: "favicon.ico" },
    { from: 32, name: "icon.png" },
    { from: 180, name: "apple-icon.png" },
];

for (const { from, name } of appCopies) {
    const src = path.join(iconsDir, `icon-${from}.png`);
    const dest = path.join(appDir, name);
    if (name === "favicon.ico") {
        await sharp(fs.readFileSync(path.join(iconsDir, "favicon.png")))
            .resize(32, 32)
            .toFile(dest);
    } else {
        fs.copyFileSync(src, dest);
    }
    console.log(`src/app/${name}`);
}

console.log("Done.");