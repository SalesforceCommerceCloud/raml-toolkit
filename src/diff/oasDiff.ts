/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags } from "@oclif/command";
import { OutputFlags } from "@oclif/parser";
import fs from 'fs-extra'
import { execSync } from "child_process";


  /**
   * Find the differences between two directories containing API spec files.
   * Only finds differences, does not classify using a ruleset.
   *
   * @param baseApis - Path to base API directory
   * @param newApis - Path to new API directory
   * @param flags - Parsed CLI flags passed to the command
   */
async function oasDiffDirs(
    baseApis: string,
    newApis: string,
    flags
  ): Promise<void> {
    try {
        
    } catch (err) {
      console.error(err.message, { exit: 2 });
    }
    // if (apiCollectionChanges.hasChanges()) {
    //   this.exit(1);
    // }
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
    flags
  ): Promise<void> {
    const file = flags["out-file"];
    if (file) {
      console.log('Saving results to file')
      if (flags.format === "json") {
        console.log('Using json format')
        await fs.writeJson(file, JSON.parse(changes));
      } else {
        console.log('Using console format')
        await fs.writeFile(file, changes);
      }
    } else {
      console.log(changes);
    }
  }  

export async function oasDiffChangelog(baseApi: string, newApi: string, flags) {
    try {
        console.log('Starting oasdiff')

        const jsonMode = flags.format === "json" ? '-f json' : '';
        const directoryMode = flags.dir ? '--composed' : '';

        // TODO: Do we want to support the other output formats?
        // See https://github.com/oasdiff/oasdiff/blob/main/docs/BREAKING-CHANGES.md#output-formats

        // TODO: Do we want to support customizing severity levels?
        // This would be akin to the raml rulesets
        const oasdiffOutput = execSync(`oasdiff changelog ${jsonMode} ${directoryMode} ${baseApi} ${newApi}`).toString();

        if (oasdiffOutput.trim().length === 0) {
            console.log("No API changes reported by oasdiff");
        } else {
            await _saveOrLogOas(oasdiffOutput, flags);
        }

    } catch (err) {
        console.error(err);
    }
}

