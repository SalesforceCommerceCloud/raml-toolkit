/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";
import fs from "fs";
import { AMF } from "amf-client-js";
import { Command, flags } from "@oclif/command";
import { validateFile, printResults, PROFILE_PATH } from "./lint";
import { allCommonFlags } from "../common/flags";

const profiles = fs
  .readdirSync(PROFILE_PATH)
  .filter((file) => path.extname(file).toLowerCase() === ".raml")
  .map((file) => file.slice(0, -5)); // Strip .raml extension from file name

export default class LintCommand extends Command {
  static description = `A linting tool for raml for Commerce Cloud and beyond`;

  static flags = {
    ...allCommonFlags(),
    // Add --profile flag to set the custom profile
    profile: flags.enum({
      char: "p",
      options: profiles,
      description: "Profile to apply",
      required: true,
    }),
    // Add --warnings flag to show warnings
    warnings: flags.boolean({
      char: "w",
      default: true,
      description: "Show all the warnings",
    }),
  };

  static args = [
    {
      name: "filename",
      description: "One or more RAML files to lint",
    },
  ];
  // Allow a variable length list of files
  static strict = false;

  async run(): Promise<void> {
    const { argv, flags } = this.parse(LintCommand);

    if (argv.length === 0) {
      this.error("Requires at least one file to validate", { exit: 1 });
    }

    let exitCode = 0;

    const promises = [];

    // Initialize AMF so that we have a clean environment to work with
    await AMF.init();
    for (const arg of argv) {
      promises.push(
        validateFile(arg, flags.profile).then((results) => {
          if (results.conforms === false) {
            exitCode += 1;
          }
          return printResults(results, flags.warnings);
        })
      );
    }

    await Promise.all(promises).catch((e) => {
      console.error(e.message);
      exitCode += 1;
    });

    if (exitCode !== 0) {
      this.error(`Validation for ${exitCode} file(s) failed.`, {
        exit: exitCode,
      });
    }
  }
}
