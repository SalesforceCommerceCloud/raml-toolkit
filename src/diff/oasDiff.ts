/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from "fs-extra";
import { exec } from "child_process";

/**
 * If a file is given, saves the changes to the file, as JSON by default.
 * Otherwise, logs the changes to console, as text by default.
 *
 * @param changes - The changes to save or log
 * @param flags - Parsed CLI flags passed to the command
 */
async function _saveOrLogOas(changes: string, flags): Promise<void> {
  const file = flags["out-file"];
  if (file) {
    console.log(`API Changes found! Saving results to file ${file}:`);
    if (flags.format === "json") {
      console.log(`    using json format`);
      await fs.writeJson(file, JSON.parse(changes));
    } else {
      console.log(`    using console format`);
      await fs.writeFile(file, changes);
    }
  } else {
    console.log(changes);
  }
}

/**
 * Execute oasdiff changelog command
 *
 * @param baseSpec - The base spec path
 * @param newSpec - The new spec path
 * @param jsonMode - JSON format flag
 * @param directoryMode - Directory mode flag
 * @returns The stdout output from oasdiff
 */
async function executeOasDiff(
  baseSpec: string,
  newSpec: string,
  jsonMode: string,
  directoryMode = ""
): Promise<string> {
  return new Promise((resolve, reject) => {
    const flags = [jsonMode, directoryMode]
      .filter((flag) => flag.trim() !== "")
      .join(" ");
    const flagsString = flags ? ` ${flags}` : "";
    // intentionally not leaving space for flagsString
    exec(
      `oasdiff changelog${flagsString} "${baseSpec}" "${newSpec}"`,
      (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      }
    );
  });
}

/**
 * Wrapper for oasdiff changelog command.
 *
 * @param baseApi - The base API file or directory
 * @param newApi - The new API file or directory
 * @param flags - Parsed CLI flags passed to the command
 * @returns 0 if no changes are reported, 1 if changes are reported, and 2 if an error occurs
 */
export async function oasDiffChangelog(baseApi: string, newApi: string, flags) {
  try {
    await checkOasDiffIsInstalled();
    console.log("......Starting oasdiff......");

    const jsonMode = flags.format === "json" ? "-f json" : "";
    const directoryMode = flags.dir ? "--composed" : "";

    let hasChanges = false;
    let hasErrors = false;
    const allResults = [];

    // Handle directory mode
    if (flags.dir) {
      // Get the list of directories in both base and new API paths
      const baseDirectories = await fs.readdir(baseApi);
      const newDirectories = await fs.readdir(newApi);

      // Loop through base directories and find matching ones in new
      for (const baseDir of baseDirectories) {
        const baseDirPath = `${baseApi}/${baseDir}`;
        const newDirPath = `${newApi}/${baseDir}`;

        // Skip if not a directory
        if (!(await fs.stat(baseDirPath)).isDirectory()) {
          continue;
        }

        // Check if matching directory doesn't exist in new
        if (!newDirectories.includes(baseDir)) {
          console.log(`${baseDir} API is deleted`);
          if (flags.format === "json") {
            allResults.push({
              directory: baseDir,
              status: "deleted",
              message: `${baseDir} API is deleted`,
            });
          } else {
            allResults.push(`======${baseDir} API is deleted======`);
          }
          hasChanges = true;
          continue;
        }

        console.log(`Processing directory pair: ${baseDir}`);

        try {
          const baseYamlPath = `${baseDirPath}/**/*.yaml`;
          const newYamlPath = `${newDirPath}/**/*.yaml`;

          const oasdiffOutput = await executeOasDiff(
            baseYamlPath,
            newYamlPath,
            jsonMode,
            directoryMode
          );

          if (oasdiffOutput.trim().length > 0) {
            console.log(`Changes found in ${baseDir}`);
            if (flags.format === "json") {
              const outputJson = JSON.parse(oasdiffOutput);
              if (outputJson.length) {
                allResults.push({
                  directory: baseDir,
                  changes: outputJson,
                });
              }
            } else {
              // For text format, add section headers
              const formattedOutput = `=== Changes in ${baseDir} ===\n${oasdiffOutput}`;
              allResults.push(formattedOutput);
            }
            hasChanges = true;
          } else {
            console.log(`No changes found in ${baseDir}`);
          }
        } catch (err) {
          console.error(`Error processing ${baseDir}:`, err);
          hasErrors = true;
        }
      }

      // Check for newly added APIs (directories in new but not in base)
      for (const newDir of newDirectories) {
        const newDirPath = `${newApi}/${newDir}`;

        // Skip if not a directory
        if (!(await fs.stat(newDirPath)).isDirectory()) {
          continue;
        }

        // Check if this directory doesn't exist in base (added API)
        if (!baseDirectories.includes(newDir)) {
          console.log(`${newDir} API is added`);
          if (flags.format === "json") {
            allResults.push({
              directory: newDir,
              status: "added",
              message: `${newDir} API is added`,
            });
          } else {
            allResults.push(`======${newDir} API is added======`);
          }
          hasChanges = true;
        }
      }
    } else {
      try {
        const oasdiffOutput = await executeOasDiff(baseApi, newApi, jsonMode);

        if (oasdiffOutput.trim().length > 0) {
          console.log("Changes found");
          if (flags.format === "json") {
            // For JSON format, parse the output
            const outputJson = JSON.parse(oasdiffOutput);
            allResults.push(outputJson);
          } else {
            allResults.push(oasdiffOutput);
          }
          hasChanges = true;
        } else {
          console.log("No changes found");
        }
      } catch (err) {
        console.error("Error processing files:", err);
        hasErrors = true;
      }
    }

    if (hasChanges) {
      if (flags.format === "json") {
        await _saveOrLogOas(JSON.stringify(allResults, null, 2), flags);
      } else {
        await _saveOrLogOas(allResults.join("\n"), flags);
      }
    }

    if (hasErrors) {
      return 2;
    }
    return hasChanges ? 1 : 0;
  } catch (err) {
    console.error(err);
    return 2;
  }
}

export async function checkOasDiffIsInstalled() {
  try {
    await new Promise<void>((resolve, reject) => {
      exec(`oasdiff --version`, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  } catch (err) {
    throw new Error(
      "oasdiff is not installed. Install oasdiff according to https://github.com/oasdiff/oasdiff#installation"
    );
  }
}
