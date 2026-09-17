// Bundles the extension into dist/extension.js so packaging doesn't need node_modules.
const esbuild = require("esbuild");

const watch = process.argv.includes("--watch");

const options = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  platform: "node",
  target: "node18",
  format: "cjs",
  external: ["vscode"],
  sourcemap: true,
  minify: false,
};

async function run() {
  if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log("esbuild watching...");
  } else {
    await esbuild.build(options);
    console.log("esbuild build complete");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
