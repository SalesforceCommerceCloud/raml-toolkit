/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Command, flags } from "@oclif/command";

import { findApiChanges, diffRaml } from "./diffProcessor";
import { NodeDiff } from "./jsonDiff";

export { findApiChanges, diffRaml, RamlDiff } from "./diffProcessor";
export { NodeDiff } from "./jsonDiff";
export default class DiffCommand extends Command {
  static description = `Takes two API spec files as input and outputs the differences.
By default, a ruleset is applied to determine if changes are breaking. Exit status is:
  0 - all changes are non-breaking
  1 - any changes are breaking
  2 - evaluation could not be completed

The ruleset flag is used to evaluate a custom ruleset in place of the default rules. The diff-only flag disables evaluation against any ruleset.
`;

  static flags = {
    // Add --version flag to show CLI version
    version: flags.version({ char: "v" }),
    // Add --help flag to show CLI version
    help: flags.help({ char: "h" }),
    ruleset: flags.string({
      char: "r",
      description: "Path to ruleset to apply to diff",
      env: "DIFF_RULESET",
      exclusive: ["diff-only"]
    }),
    "diff-only": flags.boolean({
      description:
        "Only show differences without evaluating a ruleset. The exit status in this mode is 0 for no changes, 1 for any difference and 2 when unsuccessful.",
      default: false
    })
  };

  static args = [
    {
      name: "apiSpecBasePath",
      required: true,
      description: "The base API spec file for the comparison"
    },
    {
      name: "apiSpecNewPath",
      required: true,
      description:
        "The new version of the API spec for comparison against the base version"
    }
  ];

  async run(): Promise<void> {
    const { args, flags } = this.parse(DiffCommand);

    let results: NodeDiff[];

    // Don't apply any ruleset, exit 0 for no differences, exit 1 for any
    // differences, exit 2 for unsuccessful
    if (flags["diff-only"]) {
      try {
        results = await diffRaml(args.apiSpecBasePath, args.apiSpecNewPath);
        console.log(results);
      } catch (err) {
        this.error(err.message, { exit: 2 });
      }
      if (results.length > 0) {
        this.exit(1);
      }
      this.exit();
    }

    // Apply ruleset, exit 0 for no breaking changes, exit 1 for breaking
    // changes, exit 2 for unsuccessful
    try {
      results = await findApiChanges(
        args.apiSpecBasePath,
        args.apiSpecNewPath,
        flags.ruleset
      );
      console.log(results);
    } catch (err) {
      this.error(err.message, { exit: 2 });
    }

    // TODO: Move to logic to the library
    const hasBreakingChanges = (diff: NodeDiff[]): boolean =>
      diff.some(n => n.rule?.params?.category === "Breaking");

    if (hasBreakingChanges(results)) {
      this.error("Breaking changes found.", { exit: 1 });
    }

    this.exit();
  }
}
