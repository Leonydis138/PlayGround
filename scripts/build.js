// Build: copy public/ -> dist/ (static deployment output inside PROJECT_DIR).
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const src = path.join(root, "public");
const out = path.join(root, "dist");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.cpSync(src, out, { recursive: true });
console.log(`build: ${src} -> ${out}`);
