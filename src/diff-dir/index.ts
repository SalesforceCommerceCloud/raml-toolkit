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
import path from "path";
import _ from "lodash";
import fs from "fs-extra";
import { Command, flags } from "@oclif/command";

import { diffRaml, RamlDiff } from "../diff";
import { ramlToolLogger as logger } from "../common/logger";

/**
 * Extracts all the RAML file names from the specified config file.
 *
 * @param configPath - Target config file
 *
 * @returns An array of `assetId/fileName` for every api in the input file
 */
export function listRamlsFromConfig(configPath: string): string[] {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config = require(configPath);
  const ramls = [];
  for (const apiFamily of Object.keys(config)) {
    for (const api of config[apiFamily]) {
      ramls.push(path.join(api.assetId, api.fatRaml.mainFile));
    }
  }

  return ramls;
}

/**
 * Compares two arrays and returns their intersection and symmetric difference.
 *
 * @param leftArr - One of the arrays being compared
 * @param rightArr - The other array being compared
 *
 * @returns An array each for all the common, exclusive to left and exclusive to
 * right elements.
 */
function compareArrays<T>(
  leftArr: T[],
  rightArr: T[]
): {
  leftOnly: T[];
  rightOnly: T[];
  common: T[];
} {
  const left = new Set(leftArr);
  const right = new Set(rightArr);
  const common = new Set<T>();
  left.forEach(val => {
    if (right.has(val)) {
      left.delete(val);
      right.delete(val);
      common.add(val);
    }
  });
  return {
    leftOnly: [...left],
    rightOnly: [...right],
    common: [...common]
  };
}

/**
 * Get diffs for all the common RAMLs. If diff operation fails for a RAML, log
 * the error, add a message to the diff object and continue with the rest of the
 * RAML files.
 *
 * @param dir1 - One of the directories with raml files
 * @param dir2 - The other directory with raml files
 * @param commonRamls - List of all the ramls to be compared
 * @returns An array of differences
 */
async function diffCommonRamls(
  dir1: string,
  dir2: string,
  commonRamls: string[]
): Promise<RamlDiff[]> {
  const result: RamlDiff[] = [];
  for (const raml of commonRamls) {
    const leftRaml = path.join(dir1, raml);
    const rightRaml = path.join(dir2, raml);
    const diffDetails: RamlDiff = { file: raml };
    try {
      diffDetails.diff = await diffRaml(leftRaml, rightRaml);
      if (!_.isEmpty(diffDetails.diff)) {
        result.push(diffDetails);
      }
    } catch (error) {
      logger.error(`Diff operation for '${raml}' failed:`, error);
      diffDetails.message = "The operation was unsuccessful";
      result.push(diffDetails);
    }
  }

  return result;
}

/**
 * Finds differences between the given directories for all the raml files in the
 * provided config.
 *
 * @param oldApiDir - Existing APIs
 * @param newApiDir - Newly downloaded APIs
 * @param configFile - Config file name
 *
 * @returns An array of RamlDiff objects containing differences between all the
 * old and new RAML files
 */
export async function diffNewAndArchivedRamlFiles(
  oldConfigFile: string,
  newConfigFile: string
): Promise<RamlDiff[]> {
  const oldApiDir = path.dirname(oldConfigFile);
  const newApiDir = path.dirname(newConfigFile);
  const oldRamls = listRamlsFromConfig(oldConfigFile);
  const newRamls = listRamlsFromConfig(newConfigFile);
  const ramls = compareArrays(oldRamls, newRamls);

  const result: RamlDiff[] = await diffCommonRamls(
    oldApiDir,
    newApiDir,
    ramls.common
  );

  const removedRamls: RamlDiff[] = ramls.leftOnly.map(r => ({
    file: r,
    message: "This RAML has been removed"
  }));
  const addedRamls: RamlDiff[] = ramls.rightOnly.map(r => ({
    file: r,
    message: "This RAML has been added recently"
  }));

  return result.concat(removedRamls, addedRamls);
}

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
