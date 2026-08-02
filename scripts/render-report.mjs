#!/usr/bin/env -S node --experimental-strip-types

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderHtmlReport } from "../src/report/html.ts";

const [inputArgument = "analysis.json", outputArgument = "report.html", ...extraArguments] =
  process.argv.slice(2);

if (extraArguments.length > 0) {
  throw new Error(
    "Usage: node --experimental-strip-types scripts/render-report.mjs [analysis.json] [report.html]",
  );
}

const inputPath = resolve(inputArgument);
const outputPath = resolve(outputArgument);
const report = JSON.parse(await readFile(inputPath, "utf8"));

if (report.schema_version !== 1) {
  throw new Error(`${inputPath} is not a Farpoint schema_version 1 analysis file.`);
}

await writeFile(outputPath, renderHtmlReport(report), { encoding: "utf8", mode: 0o600 });
process.stdout.write(`Report written to ${outputPath}\n`);
