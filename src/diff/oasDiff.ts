/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from "fs-extra";
import { execSync } from "child_process";

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
    console.log(`API Changes found! Saving results to file ${file}`);
    if (flags.format === "json") {
      console.log("Using json format");
      await fs.writeJson(file, JSON.parse(changes));
    } else {
      console.log("Using console format");
      await fs.writeFile(file, changes);
    }
  } else {
    console.log(changes);
  }
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
    checkOasDiffIsInstalled();
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

        // Skip if not a directory or if matching directory doesn't exist in new
        if (
          !(await fs.stat(baseDirPath)).isDirectory() ||
          !newDirectories.includes(baseDir)
        ) {
          continue;
        }

        console.log(`Processing directory pair: ${baseDir}`);

        try {
          const baseYamlPath = `"${baseDirPath}/**/*.yaml"`;
          const newYamlPath = `"${newDirPath}/**/*.yaml"`;

          const oasdiffOutput = execSync(
            `oasdiff changelog ${jsonMode} ${directoryMode} ${baseYamlPath} ${newYamlPath}`
          ).toString();

          if (oasdiffOutput.trim().length > 0) {
            console.log(`Changes found in ${baseDir}`);
            if (flags.format === "json") {
              // For JSON format, parse the output and add to array
              const outputJson = JSON.parse(oasdiffOutput);
              outputJson.directory = baseDir;
              allResults.push(outputJson);
            } else {
              allResults.push(oasdiffOutput);
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
    } else {
      // Handle single file mode
      try {
        const oasdiffOutput = execSync(
          `oasdiff changelog ${jsonMode} "${baseApi}" "${newApi}"`
        ).toString();

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

export function checkOasDiffIsInstalled() {
  try {
    execSync(`oasdiff --version`).toString();
  } catch (err) {
    throw new Error(
      "oasdiff is not installed. Install oasdiff according to https://github.com/oasdiff/oasdiff#installation"
    );
  }
}
