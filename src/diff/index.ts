/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";
import fs, { existsSync } from "fs";
import { Command, flags } from "@oclif/command";

import { findApiChanges } from "./diffProcessor";
import { NodeDiff } from "./jsonDiff";

export { findApiChanges, diffRaml, RamlDiff } from "./diffProcessor";
export { NodeDiff } from "./jsonDiff";
export default class DiffCommand extends Command {
  async run(): Promise<void> {
    const { argv, flags } = this.parse(DiffCommand);

    if (argv.length < 2) {
      this.error("Requires at least two files to perform diff", { exit: 2 });
    }

    const fileLeft = path.resolve(argv[0]);

    if (!existsSync(fileLeft)) {
      this.error(`"${argv[0]}" does not exist`, { exit: 2 });
    }

    const fileRight = path.resolve(argv[1]);

    if (!existsSync(fileRight)) {
      this.error(`"${argv[1]}" does not exist`, { exit: 2 });
    }

    const exitCode = 0;

    const results = await findApiChanges(fileLeft, fileRight);

    console.log(results);

    // TODO: Move to logic to the library
    const hasBreakingChanges = (diff: NodeDiff[]): boolean =>
      diff.some(n => n.rule?.params?.category === "Breaking");

    if (hasBreakingChanges(results)) {
      this.error("Breaking changes found.", { exit: 1 });
    }

    if (exitCode !== 0) {
      this.error(`Diff for files failed.`, {
        exit: exitCode
      });
    }

    this.exit();
  }
}

DiffCommand.description = `Takes two RAML files as input and outputs the differences.

FILENAMES are two RAML files to compare.
`;

DiffCommand.flags = {
  // Add --version flag to show CLI version
  version: flags.version({ char: "v" }),
  // Add --help flag to show CLI version
  help: flags.help({ char: "h" })
};

DiffCommand.args = [{ name: "filenameOne" }, { name: "filenameTwo" }];
