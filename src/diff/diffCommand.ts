/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Command, flags } from "@oclif/command";
import { OutputFlags } from "@oclif/parser";

import { ApiDifferencer } from "./apiDifferencer";
import { ApiChanges } from "./changes/apiChanges";
import { ApiCollectionChanges } from "./changes/apiCollectionChanges";
import { diffRamlDirectories } from "./diffDirectories";
import { oasDiffChangelog } from "./oasDiff";
import { allCommonFlags } from "../common/flags";
import fs from "fs-extra";

export class DiffCommand extends Command {
  // `raml-toolkit --help` only uses the first line, `raml-toolkit diff --help` skips it
  static description = `Compute the difference between two API specifications
This command has three modes: ruleset, diff-only, and directory.
- Ruleset mode (default) compares two files and applies a ruleset to determine if any changes are breaking.
- Diff-only mode compares two files to determine if there are any differences, without applying a ruleset.
- Directory mode finds all exchange.json files in two directories recursively and compares all the spec files described in them. Applies the default ruleset.

In ruleset and diff-only mode, the arguments must be API specification (RAML) files.
In directory mode, the arguments must be directories that contain exchange.json files.

Exit statuses:
  0 - No breaking changes (ruleset mode) or no differences (diff-only / directory)
  1 - Breaking changes (ruleset mode) or differences found (diff only / directory)
  2 - Evaluation could not be completed`;

  static flags = {
    ...allCommonFlags(),
    ruleset: flags.string({
      char: "r",
      // Oclif by default generates help text with [default: value], but in this
      // case the default is specified by the function, not the command. Also,
      // it is a full path to the file, which would change based on install location.
      // Displaying the require()-able form is shorter and always the same.
      description: `[default:${ApiDifferencer.DEFAULT_RULES_PACKAGE_PATH}] Path to ruleset to apply to diff`,
      env: "DIFF_RULESET",
      exclusive: ["diff-only", "dir"],
    }),
    "diff-only": flags.boolean({
      description: "Only show differences without evaluating a ruleset",
      default: false,
      exclusive: ["ruleset", "dir", "format"],
    }),
    dir: flags.boolean({
      description:
        "Find the differences for files in two directory trees and applies default ruleset",
      default: false,
      exclusive: ["ruleset", "diff-only"],
    }),
    "out-file": flags.string({
      char: "o",
      description: "File to store the computed difference",
    }),
    format: flags.enum({
      char: "f",
      description:
        "Format of the output. Defaults to JSON if --out-file is specified, otherwise text.",
      options: ["json", "console"],
    }),
    spec: flags.enum({
      char: "s",
      description:
        "Specifies the API spec of the files being compared. Defaults to RAML. Options are RAML or OAS",
      options: ["raml", "oas"],
    }),
    "normalize-directory-names": flags.boolean({
      description:
        "Normalize directory names by removing minor and patch versions. Example: 'shopper-stores-oas-1.0.16' -> 'shopper-stores-oas-1",
      default: false,
    }),
  };

  static args = [
    {
      name: "base",
      required: true,
      description:
        "The base API spec file (ruleset / diff-only mode) or directory",
    },
    {
      name: "new",
      required: true,
      description:
        "The new API spec file (ruleset / diff-only mode) or directory",
    },
  ];

  /**
   * If a file is given, saves the changes to the file, as JSON by default.
   * Otherwise, logs the changes to console, as text by default.
   *
   * @param changes - The changes to save or log
   * @param flags - Parsed CLI flags passed to the command
   */
  protected async _saveOrLog(
    changes: ApiChanges | ApiCollectionChanges,
    flags: OutputFlags<typeof DiffCommand.flags>
  ): Promise<void> {
    const file = flags["out-file"];
    if (file) {
      // If file is given, default to JSON format unless text is specified
      if (flags.format === "console") {
        await fs.writeFile(file, changes.toFormattedString("console"));
      } else {
        await fs.writeJson(file, changes);
      }
    } else {
      // If file is not given, default to text unless JSON is specified
      if (flags.format === "json" || flags["diff-only"]) {
        this.log(JSON.stringify(changes, null, 2));
      } else {
        this.log(changes.toFormattedString("console"));
      }
    }
  }

  /**
   * Find the differences between two directories containing API spec files.
   * Only finds differences, does not classify using a ruleset.
   *
   * @param baseApis - Path to base API directory
   * @param newApis - Path to new API directory
   * @param flags - Parsed CLI flags passed to the command
   */
  protected async _diffDirs(
    baseApis: string,
    newApis: string,
    flags: OutputFlags<typeof DiffCommand.flags>
  ): Promise<void> {
    let apiCollectionChanges: ApiCollectionChanges;
    try {
      apiCollectionChanges = await diffRamlDirectories(baseApis, newApis);
      await this._saveOrLog(apiCollectionChanges, flags);
    } catch (err) {
      this.error(err.message, { exit: 2 });
    }
    if (apiCollectionChanges.hasChanges()) {
      this.exit(1);
    }
  }

  /**
   * Find the differences between two API specification files. Does not classify
   * the differences.
   *
   * @param baseApis - Path to a base API spec file
   * @param newApis - Path to a new API spec file
   * @param flags - Parsed CLI flags passed to the command
   */
  protected async _diffFiles(
    baseApis: string,
    newApis: string,
    flags: OutputFlags<typeof DiffCommand.flags>
  ): Promise<void> {
    // Don't apply any ruleset, exit 0 for no differences, exit 1 for any
    // differences, exit 2 for unsuccessful
    let apiChanges: ApiChanges;
    try {
      const apiDifferencer = new ApiDifferencer(baseApis, newApis);
      apiChanges = await apiDifferencer.findChanges();
      await this._saveOrLog(apiChanges, flags);
    } catch (err) {
      this.error(err.message, { exit: 2 });
    }
    if (apiChanges.hasChanges()) {
      this.exit(1);
    }
  }

  /**
   * Find the differences between two API specification files and classifies
   * the changes according to a ruleset.
   *
   * @param baseApis - Path to a base API spec file
   * @param newApis - Path to a new API spec file
   * @param flags - Parsed CLI flags passed to the command
   */
  protected async _diffFilesUsingRuleset(
    baseApis: string,
    newApis: string,
    flags: OutputFlags<typeof DiffCommand.flags>
  ): Promise<void> {
    // Apply ruleset, exit 0 for no breaking changes, exit 1 for breaking
    // changes, exit 2 for unsuccessful
    let apiChanges: ApiChanges;

    const apiDifferencer = new ApiDifferencer(baseApis, newApis);
    try {
      apiChanges = await apiDifferencer.findAndCategorizeChanges(flags.ruleset);
      await this._saveOrLog(apiChanges, flags);
    } catch (err) {
      this.error(err.message, { exit: 2 });
    }
    if (apiChanges.hasBreakingChanges()) {
      this.exit(1);
    }
  }

  /**
   * Find the differences between two OAS files.
   *
   * Requires oasDiff to be installed to work. Will return an error if oasDiff is not installed
   *
   * Otherwise, returns the exit code of oasDiff.oasDiffChangelog
   *
   * @param baseApis - Path to a base OAS file or directory containing OAS files
   * @param newApis - Path to a new OAS file or directory containing OAS files
   * @param flags - Parsed CLI flags passed to the command
   */
  protected async _diffOasFiles(
    baseApis: string,
    newApis: string,
    flags: OutputFlags<typeof DiffCommand.flags>
  ): Promise<number> {
    // Diff two files (we do not have a custom ruleset defined for OAS
    // By default, checks are all 'diff-only'
    return await oasDiffChangelog(baseApis, newApis, flags);
  }

  async run(): Promise<void> {
    const { args, flags } = this.parse(DiffCommand);
    const baseApis = args.base;
    const newApis = args.new;
    let exitCode = 0;
    if (!(await fs.pathExists(baseApis))) {
      this.error(`File or directory not found: ${baseApis}`, { exit: 2 });
    }
    if (!(await fs.pathExists(newApis))) {
      this.error(`File or directory not found: ${newApis}`, { exit: 2 });
    }
    if (flags.spec === "oas") {
      exitCode = await this._diffOasFiles(baseApis, newApis, flags);
    } else {
      if (flags.dir) {
        await this._diffDirs(baseApis, newApis, flags);
      } else if (flags["diff-only"]) {
        await this._diffFiles(baseApis, newApis, flags);
      } else {
        await this._diffFilesUsingRuleset(baseApis, newApis, flags);
      }
    }
    this.exit(exitCode);
  }
}
