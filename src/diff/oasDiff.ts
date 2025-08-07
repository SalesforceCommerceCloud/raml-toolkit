/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint header/header: "off", max-lines:"off" */

import fs from "fs-extra";
import { exec } from "child_process";
import path from "path";

/**
 * Interface for flags used in oasDiff functions
 */
interface OasDiffFlags {
  format?: "json" | "console";
  dir?: boolean;
  "out-file"?: string;
  "normalize-directory-names"?: boolean;
}

/**
 * Represents a directory-level API change (added/deleted)
 */
interface DirectoryStatusChange {
  directory: string;
  status: "added" | "deleted";
  message: string;
}

/**
 * Represents file-level changes within a directory
 */
interface FileChange {
  file: string;
  status: "added" | "deleted";
  message: string;
}

/**
 * Represents changes found in a directory with detailed change information
 */
interface DirectoryChanges {
  directory: string;
  changes: (FileChange | Record<string, unknown>)[];
}

/**
 * Union type for all possible result items
 * - string: Text format output
 * - DirectoryStatusChange: JSON format for added/deleted directories
 * - DirectoryChanges: JSON format for directories with file changes
 * - unknown[]: Parsed JSON output from oasdiff (structure depends on oasdiff output)
 */
type OasDiffResult =
  | string
  | DirectoryStatusChange
  | DirectoryChanges
  | unknown[];

/**
 * Return type for oasDiff handler functions
 */
interface OasDiffHandlerResult {
  results: OasDiffResult[];
  hasChanges: boolean;
  hasErrors: boolean;
}

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
      // If this is a leaf directory and we haven't found exchange.json, that's an error
      if (subdirectories.length === 0 && !hasExchangeJson) {
        console.warn(
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
 * Find YAML files in a directory
 *
 * @param dirPath - The directory path to search
 * @returns Array of YAML file paths
 */
async function findYamlFiles(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath);
    const yamlFiles = [];

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry);
      const stat = await fs.stat(entryPath);

      if (
        stat.isFile() &&
        (entry.endsWith(".yaml") || entry.endsWith(".yml"))
      ) {
        yamlFiles.push(entryPath);
      }
    }

    return yamlFiles;
  } catch (err) {
    console.warn(`Warning: Could not read directory ${dirPath}:`, err.message);
    return [];
  }
}

/**
 * If a file is given, saves the changes to the file, as JSON by default.
 * Otherwise, logs the changes to console, as text by default.
 *
 * @param changes - The changes to save or log
 * @param flags - Parsed CLI flags passed to the command
 */
async function _saveOrLogOas(
  changes: string,
  flags: OasDiffFlags
): Promise<void> {
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
 * Remove minor and patch versions from directory names and keep only major version
 * Example: 'shopper-stores-oas-1.0.16' -> 'shopper-stores-oas-1'
 * We want to keep the major version for multiple versions of the same API, ie: Shopper Baskets
 *
 * @param dirs - Array of directory objects with name and path properties
 * @returns Copy of passed array with updated name property
 */
function normalizeDirectoryNames(
  dirs: Array<{ name: string; path: string }>
): Array<{ name: string; path: string }> {
  return dirs.map((dir) => ({
    ...dir,
    // matches the pattern of the version number in the directory name, ie: -1.0.16
    // extracts the major version number if available, otherwise the original match if no major version is found
    name: dir.name.replace(/-\d+\.\d+\.\d+$/, (match) => {
      const majorVersion = match.match(/^-\d+/)?.[0];
      return majorVersion || match;
    }),
  }));
}

/**
 * Handle directory mode comparison logic
 *
 * @param baseApi - The base API directory
 * @param newApi - The new API directory
 * @param jsonMode - JSON formatting flag
 * @param flags - CLI flags
 * @returns Object containing results, hasChanges flag, and hasErrors flag
 */
async function handleDirectoryMode(
  baseApi: string,
  newApi: string,
  jsonMode: string,
  flags: OasDiffFlags
): Promise<OasDiffHandlerResult> {
  const allResults: OasDiffResult[] = [];
  let hasChanges = false;
  let hasErrors = false;

  // Find all exchange.json files and their parent directories
  let baseExchangeDirs = await findExchangeDirectories(baseApi);
  let newExchangeDirs = await findExchangeDirectories(newApi);

  if (flags["normalize-directory-names"]) {
    baseExchangeDirs = normalizeDirectoryNames(baseExchangeDirs);
    newExchangeDirs = normalizeDirectoryNames(newExchangeDirs);
  }

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

    // Both directories exist, compare individual yml files in each directory
    if (baseDir && newDir) {
      console.log("===================================");
      console.log(`Processing directory pair: ${dirName}`);

      try {
        const baseYamlFiles = await findYamlFiles(baseDir.path);
        const newYamlFiles = await findYamlFiles(newDir.path);

        const directoryChanges: (FileChange | Record<string, unknown>)[] = [];
        const directoryChangesText: string[] = [];

        // Process each YAML file pair
        for (const baseYamlFile of baseYamlFiles) {
          const baseFileName = path.basename(baseYamlFile);
          const newYamlFile = newYamlFiles.find(
            (f) => path.basename(f) === baseFileName
          );

          if (newYamlFile) {
            console.log(`Comparing ${baseFileName} in ${dirName}`);
            const oasdiffOutput = await executeOasDiff(
              baseYamlFile,
              newYamlFile,
              jsonMode
            );

            if (oasdiffOutput.trim().length > 0) {
              if (flags.format === "json") {
                const outputJson = JSON.parse(oasdiffOutput);
                if (outputJson?.length > 0) {
                  directoryChanges.push(...outputJson);
                }
              } else {
                directoryChangesText.push(
                  `--- Changes in ${baseFileName} ---\n${oasdiffOutput}`
                );
              }
            }
          } else {
            console.log(`File ${baseFileName} was deleted in ${dirName}`);
            if (flags.format === "json") {
              directoryChanges.push({
                file: baseFileName,
                status: "deleted",
                message: `File ${baseFileName} was deleted`,
              });
            } else {
              directoryChangesText.push(
                `--- File ${baseFileName} was deleted ---`
              );
            }
          }
        }

        // Check for added files
        for (const newYamlFile of newYamlFiles) {
          const newFileName = path.basename(newYamlFile);
          const baseYamlFile = baseYamlFiles.find(
            (f) => path.basename(f) === newFileName
          );

          if (!baseYamlFile) {
            console.log(`File ${newFileName} was added in ${dirName}`);
            if (flags.format === "json") {
              directoryChanges.push({
                file: newFileName,
                status: "added",
                message: `File ${newFileName} was added`,
              });
            } else {
              directoryChangesText.push(
                `--- File ${newFileName} was added ---`
              );
            }
          }
        }

        if (directoryChanges.length > 0 || directoryChangesText.length > 0) {
          console.log(`Changes found in ${dirName}`);
          if (flags.format === "json") {
            allResults.push({
              directory: dirName,
              changes: directoryChanges,
            });
          } else {
            const formattedOutput = `=== Changes in ${dirName} ===\n${directoryChangesText.join(
              "\n"
            )}`;
            allResults.push(formattedOutput);
          }
          hasChanges = true;
        } else {
          console.log(`No changes found in ${dirName}`);
        }
      } catch (err) {
        console.error(`Error processing ${dirName}:`, err);
        hasErrors = true;
      }
    }
  }

  return { results: allResults, hasChanges, hasErrors };
}

/**
 * Handle single file mode comparison logic
 *
 * @param baseApi - The base API file
 * @param newApi - The new API file
 * @param jsonMode - JSON formatting flag
 * @param flags - CLI flags
 * @returns Object containing results, hasChanges flag, and hasErrors flag
 */
async function handleSingleFileMode(
  baseApi: string,
  newApi: string,
  jsonMode: string,
  flags: OasDiffFlags
): Promise<OasDiffHandlerResult> {
  const allResults: OasDiffResult[] = [];
  let hasChanges = false;
  let hasErrors = false;

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

  return { results: allResults, hasChanges, hasErrors };
}

/**
 * Wrapper for oasdiff changelog command.
 *
 * @param baseApi - The base API file or directory
 * @param newApi - The new API file or directory
 * @param flags - Parsed CLI flags passed to the command
 * @returns 0 if no changes are reported, 1 if changes are reported, and 2 if an error occurs
 */
export async function oasDiffChangelog(
  baseApi: string,
  newApi: string,
  flags: OasDiffFlags
) {
  try {
    await checkOasDiffIsInstalled();
    console.log("......Starting oasdiff......");

    const jsonMode = flags.format === "json" ? "-f json" : "";

    // Handle directory mode or single file mode
    const { results, hasChanges, hasErrors } = flags.dir
      ? await handleDirectoryMode(baseApi, newApi, jsonMode, flags)
      : await handleSingleFileMode(baseApi, newApi, jsonMode, flags);

    if (hasChanges) {
      if (flags.format === "json") {
        await _saveOrLogOas(JSON.stringify(results, null, 2), flags);
      } else {
        await _saveOrLogOas(results.join("\n"), flags);
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
