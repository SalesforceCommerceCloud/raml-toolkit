/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Command, flags } from "@oclif/command";
import { OutputFlags } from "@oclif/parser";
import fs from "fs-extra";

import { ApiDifferencer } from "./apiDifferencer";
import { ApiChanges } from "./changes/apiChanges";
import { ApiCollectionChanges } from "./changes/apiCollectionChanges";
import { diffRamlDirectories } from "./diffDirectories";
import { allCommonFlags } from "../common/flags";

export class DiffCommand extends Command {
  // `raml-toolkit --help` only uses the first line, `raml-toolkit diff --help` skips it
  static description = `Compute the difference between two API specifications
This command has three modes: ruleset, diff-only, and directory.
  Ruleset mode (default) compares two files and applies a ruleset to determine if any changes are breaking.
  Diff-only mode compares two files to determine if there are any differences, without applying a ruleset.
  Directory mode compares all the files in two directories and determines if there are any differences.

In ruleset and diff-only mode, the arguments must be API specification (RAML) files.
In directory mode, the arguments must be API configuration (JSON) files.

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
      exclusive: ["ruleset", "dir"],
    }),
    dir: flags.boolean({
      description: "Find the differences for all files in two directories",
      default: false,
      exclusive: ["ruleset", "diff-only"],
    }),
    "out-file": flags.string({
      char: "o",
      description: "File to store the computed difference",
    }),
  };

  static args = [
    {
      name: "base",
      required: true,
      description:
        "The base API spec file (ruleset / diff-only mode) or configuration (directory mode)",
    },
    {
      name: "new",
      required: true,
      description:
        "The new API spec file (ruleset / diff-only mode) or configuration (directory mode)",
    },
  ];

  /**
   * If a file is given, saves data to the file. Otherwise, just logs the data.
   * The data must be JSON-serializable.
   *
   * @param json - The data to save or log
   * @param file - The file to save to
   */
  protected async _saveOrLog(json: unknown, file?: string): Promise<void> {
    if (file) {
      await fs.writeJson(file, json);
    } else {
      console.log(json);
    }
  }

  /**
   * Find the differences between two directories containing API spec files.
   * Only finds differences, does not classify using a ruleset.
   *
   * @param baseApis - Path to an API config file in the base directory
   * @param newApis - Path to an API config file in the new directory
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
      await this._saveOrLog(apiCollectionChanges, flags["out-file"]);
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
      await this._saveOrLog(apiChanges, flags["out-file"]);
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
      await this._saveOrLog(apiChanges, flags["out-file"]);
    } catch (err) {
      this.error(err.message, { exit: 2 });
    }
    if (apiChanges.hasBreakingChanges()) {
      this.error("Breaking changes found.", { exit: 1 });
    }
  }

  async run(): Promise<void> {
    const { args, flags } = this.parse(DiffCommand);
    if (flags.dir) {
      await this._diffDirs(args.base, args.new, flags);
    } else if (flags["diff-only"]) {
      await this._diffFiles(args.base, args.new, flags);
    } else {
      await this._diffFilesUsingRuleset(args.base, args.new, flags);
    }
    this.exit();
  }
}
