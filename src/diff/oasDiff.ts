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
 * @param newApi - The new API file
 * @param flags - Parsed CLI flags passed to the command
 * @returns 0 if no changes are reported, 1 if changes are reported, and 2 if an error occurs
 */
export async function oasDiffChangelog(baseApi: string, newApi: string, flags) {
  try {
    checkOasDiffIsInstalled();
    console.log("Starting oasdiff");

    const jsonMode = flags.format === "json" ? "-f json" : "";
    const directoryMode = flags.dir ? "--composed" : "";

    // If the user is diffing directories, we need to pass the glob pattern to oasdiff
    let baseApiTarget = baseApi;
    let newApiTarget = newApi;
    if (flags.dir) {
      baseApiTarget = '"' + baseApi + "/**/*.yaml" + '"';
      newApiTarget = '"' + newApi + "/**/*.yaml" + '"';
    }

    // TODO: Do we want to support the other output formats?
    // See https://github.com/oasdiff/oasdiff/blob/main/docs/BREAKING-CHANGES.md#output-formats

    // TODO: Do we want to support customizing severity levels?
    // This would be akin to the raml rulesets
    const oasdiffOutput = execSync(
      `oasdiff changelog ${jsonMode} ${directoryMode} ${baseApiTarget} ${newApiTarget}`
    ).toString();

    if (oasdiffOutput.trim().length === 0) {
      console.log("No API changes reported by oasdiff");
      return 0;
    } else {
      await _saveOrLogOas(oasdiffOutput, flags);
      return 1;
    }
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
