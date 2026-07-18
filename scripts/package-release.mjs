import { copyFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8"));
const version = packageJson.version;

if (typeof version !== "string" || version.length === 0) {
	throw new Error("package.json must contain a version");
}

const manifestSourceName = version.includes("b") ? "manifest-beta.json" : "manifest.json";
const manifestSourcePath = join(rootDir, manifestSourceName);
const manifest = JSON.parse(readFileSync(manifestSourcePath, "utf8"));

if (manifest.version !== version) {
	throw new Error(`${manifestSourceName} version ${manifest.version} does not match package.json version ${version}`);
}

const outputDir = join(rootDir, "dist");
const artifacts = [
	["main.js", "main.js"],
	[manifestSourceName, "manifest.json"],
	["styles.css", "styles.css"],
];

for (const [sourceName] of artifacts) {
	if (!existsSync(join(rootDir, sourceName))) {
		throw new Error(`Required release artifact does not exist: ${sourceName}`);
	}
}

mkdirSync(outputDir, { recursive: true });

for (const [sourceName, targetName] of artifacts) {
	copyFileSync(join(rootDir, sourceName), join(outputDir, targetName));
}

console.log(`Release artifacts written to ${relative(process.cwd(), outputDir)}`);
