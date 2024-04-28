import { readFileSync, writeFileSync } from "fs";
import { simpleGit } from "simple-git";

const currentVersion = process.env.npm_package_version;
const targetVerArr = currentVersion.split(".");

switch (process.env.release_type?.toLowerCase()) {
    case "major":
        targetVerArr[0] = Number(targetVerArr[0]) + 1;
        targetVerArr[1] = 0;
        targetVerArr[2] = 0;
        break;
    case "minor":
        targetVerArr[1] = Number(targetVerArr[1]) + 1;
        targetVerArr[2] = 0;
        break;

    case "patch":
        targetVerArr[2] = Number(targetVerArr[2].split("b")[0]) + 1;
        break;

    case "beta":
        const patch = targetVerArr[2].split("b");
        if (patch.length <= 1) {
            targetVerArr[2] = `${targetVerArr[2]}b1`;
        } else {
            targetVerArr[2] = `${patch[0]}b${Number(patch[1]) + 1}`;
        }
        break;

    default:
        console.error("No release type specified, cowardly refusing to continue.");
        process.exit(1);
}

const targetVersion = targetVerArr.join(".");
console.log(`Bumping to ${targetVersion}`);

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
pkg.version = targetVersion;
writeFileSync("package.json", JSON.stringify(pkg, null, "\t"));

// read minAppVersion from manifest.json and bump version to target version
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
if (manifest.version !== targetVersion && !targetVersion.includes("b")) {
    manifest.version = targetVersion;
    writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));
}

// beta versions should remain in sync with the main manifest if there isn't a current beta release
const betaManifest = JSON.parse(readFileSync("manifest-beta.json", "utf8"));
if (betaManifest.version === currentVersion || targetVersion.includes("b")) {
    betaManifest.version = targetVersion;
    writeFileSync("manifest-beta.json", JSON.stringify(betaManifest, null, "\t"));
}

// update versions.json with target version and minAppVersion from manifest.json
const versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));

// TODO: update changelog

// time for git
const git = simpleGit({
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: false,
});

git.add(["package.json", "manifest.json", "manifest-beta.json", "versions.json"]);

// create commit+tag, use commit messages since last tag as description
git.tags([], (err, data) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    git.log({ from: data.latest }).then((data) => {
        const body = data.all.map((c) => `- ${c.message}`).join("\n");
        git.commit([`release: ${targetVersion}`, body]).then(() => {
            git.tag([targetVersion]);
        });
    });
});
