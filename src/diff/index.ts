/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Command, flags } from "@oclif/command";
import { OutputFlags } from "@oclif/parser";
import fs from "fs-extra";

import { diffRamlDirectories } from "./diffDirectories";
import {
  defaultRulesPackagePath,
  findApiChanges,
  diffRaml
} from "./diffProcessor";
import { NodeDiff } from "./jsonDiff";

export default class DiffCommand extends Command {
  // Oclif eats the first line of the description, so it's left blank.
  static description = `
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
    // Add --version flag to show CLI version
    version: flags.version({ char: "v" }),
    // Add --help flag to show CLI version
    help: flags.help({ char: "h" }),
    ruleset: flags.string({
      char: "r",
      // Oclif by default generated help text with [default: value], but in this
      // case the default is speciified by the function, not the command. Also,
      // it is a full path to the file, which would change based on install location.
      // Displaying the require()-able form is shorter and always the same.
      description: `[default:${defaultRulesPackagePath}] Path to ruleset to apply to diff`,
      env: "DIFF_RULESET",
      exclusive: ["diff-only", "dir"]
    }),
    "diff-only": flags.boolean({
      description: "Only show differences without evaluating a ruleset",
      default: false,
      exclusive: ["ruleset", "dir"]
    }),
    dir: flags.boolean({
      description: "Find the differences for all files in two directories",
      default: false,
      exclusive: ["ruleset", "diff-only"]
    }),
    "out-file": flags.string({
      char: "o",
      description: "File to store the computed difference"
    })
  };

  static args = [
    {
      name: "oldApis",
      required: true,
      description:
        "The old API spec file (ruleset / diff-only mode) or configuration (directory mode)"
    },
    {
      name: "newApis",
      required: true,
      description:
        "The new API spec file (ruleset / diff-only mode) or configuration (directory mode)"
    }
  ];

  protected async _saveOrLog(file: string, json: object): Promise<void> {
    if (file) {
      await fs.writeJson(file, json);
    } else {
      console.log(json);
    }
  }

  protected async _diffDirs(
    oldApis: string,
    newApis: string,
    flags: OutputFlags<typeof DiffCommand.flags>
  ): Promise<void> {
    const results = await diffRamlDirectories(oldApis, newApis);
    await this._saveOrLog(flags["out-file"], results);

    if (results.length > 0) {
      this.exit(1);
    }
  }

  protected async _diffFiles(
    oldApis: string,
    newApis: string,
    flags: OutputFlags<typeof DiffCommand.flags>
  ): Promise<void> {
    // Don't apply any ruleset, exit 0 for no differences, exit 1 for any
    // differences, exit 2 for unsuccessful
    let results: NodeDiff[];
    try {
      results = await diffRaml(oldApis, newApis);
      await this._saveOrLog(flags["out-file"], results);
    } catch (err) {
      this.error(err.message, { exit: 2 });
    }
    if (results.length > 0) {
      this.exit(1);
    }
  }

  protected async _diffFilesUsingRuleset(
    oldApis: string,
    newApis: string,
    flags: OutputFlags<typeof DiffCommand.flags>
  ): Promise<void> {
    // Apply ruleset, exit 0 for no breaking changes, exit 1 for breaking
    // changes, exit 2 for unsuccessful
    let results: NodeDiff[];
    try {
      results = await findApiChanges(oldApis, newApis, flags.ruleset);
      await this._saveOrLog(flags["out-file"], results);
    } catch (err) {
      this.error(err.message, { exit: 2 });
    }

    // TODO: Move to logic to the library
    const hasBreakingChanges = (diff: NodeDiff[]): boolean =>
      diff.some(n => n.rule?.params?.category === "Breaking");

    if (hasBreakingChanges(results)) {
      this.error("Breaking changes found.", { exit: 1 });
    }
  }

  async run(): Promise<void> {
    const { args, flags } = this.parse(DiffCommand);
    if (flags.dir) {
      await this._diffDirs(args.oldApis, args.newApis, flags);
    } else if (flags["diff-only"]) {
      await this._diffFiles(args.oldApis, args.newApis, flags);
    } else {
      await this._diffFilesUsingRuleset(args.oldApis, args.newApis, flags);
    }
    this.exit();
  }
}
