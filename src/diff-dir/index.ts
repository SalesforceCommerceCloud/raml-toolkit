/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from "fs-extra";
import { Command, flags } from "@oclif/command";

import { diffNewAndArchivedRamlFiles } from "./helpers";

export class DiffDirectoriesCommand extends Command {
  static description = `Compute the difference between two sets of API specs.`;
  static args = [
    {
      name: "oldApis",
      description:
        "API config file in the directory containing the original API specs",
      required: true
    },
    {
      name: "newApis",
      description:
        "API config file in the directory containing the new API specs",
      required: true
    }
  ];
  static flags = {
    "out-file": flags.string({
      char: "o",
      description: "File to store the computed difference"
    })
  };
  async run(): Promise<void> {
    const { args, flags } = this.parse(DiffDirectoriesCommand);
    const result = await diffNewAndArchivedRamlFiles(
      args.oldApis,
      args.newApis
    );
    const outfile = flags["out-file"];
    if (outfile) {
      await fs.writeJson(outfile, result);
    } else {
      this.log(JSON.stringify(result, null, 2));
    }
  }
}
