import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const reportDirectory = resolve(projectRoot, "reports");
const validation = await import(pathToFileURL(resolve(projectRoot, "src/stage7PathValidation.ts")));
const report = validation.runStage7PathValidation();
const summary = validation.formatStage7PathValidationSummary(report);

await mkdir(reportDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(reportDirectory, "stage7-path-validation.json"), `${JSON.stringify(report, null, 2)}\n`),
  writeFile(resolve(reportDirectory, "stage7-path-validation.md"), summary)
]);
process.stdout.write(summary);

if (!report.passed) {
  process.exitCode = 1;
}
