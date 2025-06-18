/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from "fs-extra";
import { exec } from "child_process";
import path from "path";

/**
 * Recursively find directories containing exchange.json files
 *
 * @param rootPath - The root path to search from
 * @returns Array of objects with directory name and full path
 */
async function findExchangeDirectories(
  rootPath: string
): Promise<Array<{ name: string; path: string }>> {
  const result = [];
  // assume the directory depth is 3, we don't want to go too deep
  const maxDepth = 3;
  let foundAnyExchangeJson = false;

  async function searchDirectory(currentPath: string, depth = 0) {
    if (depth > maxDepth) {
      throw new Error(
        `Maximum directory depth (${maxDepth}) exceeded while searching for exchange.json files in: ${currentPath}`
      );
    }

    try {
      const entries = await fs.readdir(currentPath);

      // Check if current directory contains exchange.json
      const hasExchangeJson = entries.includes("exchange.json");

      if (hasExchangeJson) {
        foundAnyExchangeJson = true;
        const dirName = path.basename(currentPath);
        result.push({
          name: dirName,
          path: currentPath,
        });
        return;
      }

      // Check if this is a leaf directory (no subdirectories)
      const subdirectories = [];
      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry);
        const stat = await fs.stat(entryPath);
        if (stat.isDirectory()) {
          subdirectories.push(entryPath);
        }
      }
      console.log("subdirectories", subdirectories);
      console.log("hasExchangeJson", hasExchangeJson);
      // If this is a leaf directory and we haven't found exchange.json, that's an error
      if (subdirectories.length === 0 && !hasExchangeJson) {
        throw new Error(
          `No exchange.json file found in leaf directory: ${currentPath}. Each API directory must contain an exchange.json file.`
        );
      }

      // Search subdirectories
      for (const subPath of subdirectories) {
        await searchDirectory(subPath, depth + 1);
      }
    } catch (err) {
      // Re-throw our custom errors
      if (
        err.message.includes("exchange.json") ||
        err.message.includes("Maximum directory depth")
      ) {
        throw err;
      }
      // Ignore other errors for individual directories (permissions, etc.)
      console.warn(
        `Warning: Could not read directory ${currentPath}:`,
        err.message
      );
    }
  }

  await searchDirectory(rootPath);

  // Final check: if we didn't find any exchange.json files at all
  if (!foundAnyExchangeJson) {
    throw new Error(
      `No exchange.json files found in any directory under: ${rootPath}. Each API directory must contain an exchange.json file.`
    );
  }

  return result;
}

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
      // Find all exchange.json files and their parent directories
      const baseExchangeDirs = await findExchangeDirectories(baseApi);
      const newExchangeDirs = await findExchangeDirectories(newApi);

      const allDirNames = new Set([
        ...baseExchangeDirs.map((dir) => dir.name),
        ...newExchangeDirs.map((dir) => dir.name),
      ]);

      for (const dirName of allDirNames) {
        const baseDir = baseExchangeDirs.find((dir) => dir.name === dirName);
        const newDir = newExchangeDirs.find((dir) => dir.name === dirName);

        // Check if directory was deleted
        if (baseDir && !newDir) {
          console.log(`${dirName} API is deleted`);
          if (flags.format === "json") {
            allResults.push({
              directory: dirName,
              status: "deleted",
              message: `${dirName} API is deleted`,
            });
          } else {
            allResults.push(`======${dirName} API is deleted======`);
          }
          hasChanges = true;
          continue;
        }

        // Check if directory was added
        if (!baseDir && newDir) {
          console.log(`${dirName} API is added`);
          if (flags.format === "json") {
            allResults.push({
              directory: dirName,
              status: "added",
              message: `${dirName} API is added`,
            });
          } else {
            allResults.push(`======${dirName} API is added======`);
          }
          hasChanges = true;
          continue;
        }

        // Both directories exist, compare them
        if (baseDir && newDir) {
          console.log(`Processing directory pair: ${dirName}`);

          try {
            const baseYamlPath = `${baseDir.path}/**/*.yaml`;
            const newYamlPath = `${newDir.path}/**/*.yaml`;

            const oasdiffOutput = await executeOasDiff(
              baseYamlPath,
              newYamlPath,
              jsonMode,
              directoryMode
            );

            if (oasdiffOutput.trim().length > 0) {
              console.log(`Changes found in ${dirName}`);
              if (flags.format === "json") {
                const outputJson = JSON.parse(oasdiffOutput);
                if (outputJson?.length > 0) {
                  allResults.push({
                    directory: dirName,
                    changes: outputJson,
                  });
                  hasChanges = true;
                }
              } else {
                // For text format, add section headers
                const formattedOutput = `=== Changes in ${dirName} ===\n${oasdiffOutput}`;
                allResults.push(formattedOutput);
                hasChanges = true;
              }
            } else {
              console.log(`No changes found in ${dirName}`);
            }
          } catch (err) {
            console.error(`Error processing ${dirName}:`, err);
            hasErrors = true;
          }
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
            if (outputJson?.length > 0) {
              allResults.push(outputJson);
              hasChanges = true;
            }
          } else {
            allResults.push(oasdiffOutput);
            hasChanges = true;
          }
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
