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
  "out-file"?: string;
}

/**
 * Union type for all possible result items
 * - string: Text format output
 * - unknown[]: Parsed JSON output from oasdiff (structure depends on oasdiff output)
 */
type OasDiffResult = string | unknown[];

/**
 * Return type for oasDiff handler functions
 */
interface OasDiffHandlerResult {
  results: OasDiffResult[];
  hasChanges: boolean;
  hasErrors: boolean;
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
 * @returns The stdout output from oasdiff
 */
async function executeOasDiff(
  baseSpec: string,
  newSpec: string,
  jsonMode: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const flagsString = jsonMode ? ` ${jsonMode}` : "";
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
 * Handle file comparison logic
 *
 * @param baseApi - The base API file
 * @param newApi - The new API file
 * @param jsonMode - JSON formatting flag
 * @param flags - CLI flags
 * @returns Object containing results, hasChanges flag, and hasErrors flag
 */
async function handleFileComparison(
  baseApi: string,
  newApi: string,
  jsonMode: string,
  flags: OasDiffFlags
): Promise<OasDiffHandlerResult> {
  const allResults: OasDiffResult[] = [];
  let hasChanges = false;
  let hasErrors = false;

  try {
    console.log(`Comparing files: ${path.basename(baseApi)} vs ${path.basename(newApi)}`);
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
 * @param baseApi - The base API file
 * @param newApi - The new API file
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

    // Always handle file comparison
    const { results, hasChanges, hasErrors } = await handleFileComparison(
      baseApi,
      newApi,
      jsonMode,
      flags
    );

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
