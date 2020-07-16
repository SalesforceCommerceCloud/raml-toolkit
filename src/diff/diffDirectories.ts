/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from "path";
import _ from "lodash";
import { diffRaml, RamlDiff } from "./diffProcessor";
import { ramlToolLogger } from "../common/logger";

/**
 * Extracts all the RAML file names from the specified config file.
 *
 * @param configPath - Target config file
 *
 * @returns An array of `assetId/fileName` for every api in the input file
 */
export function listRamlsFromConfig(configPath: string): string[] {
  // path.resolve() is required to ensure configPath is absolute
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config = require(path.resolve(configPath));
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
 * Expects arrays to have no duplicate elements.
 *
 * @param leftArr - One of the arrays being compared
 * @param rightArr - The other array being compared
 *
 * @returns An array each for all the common, exclusive to left and exclusive to
 * right elements.
 */
function getCommonAndUniqueElements<T>(
  leftArr: T[],
  rightArr: T[]
): {
  common: T[];
  unique: [T[], T[]];
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
    common: [...common],
    unique: [[...left], [...right]]
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
      ramlToolLogger.error(`Diff operation for '${raml}' failed:`, error);
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
export async function diffRamlDirectories(
  oldConfigFile: string,
  newConfigFile: string
): Promise<RamlDiff[]> {
  const oldApiDir = path.dirname(oldConfigFile);
  const newApiDir = path.dirname(newConfigFile);
  const oldRamls = listRamlsFromConfig(oldConfigFile);
  const newRamls = listRamlsFromConfig(newConfigFile);
  const ramls = getCommonAndUniqueElements(oldRamls, newRamls);

  const result: RamlDiff[] = await diffCommonRamls(
    oldApiDir,
    newApiDir,
    ramls.common
  );

  const removedRamls: RamlDiff[] = ramls.unique[0].map(r => ({
    file: r,
    message: "This RAML has been removed"
  }));
  const addedRamls: RamlDiff[] = ramls.unique[1].map(r => ({
    file: r,
    message: "This RAML has been added recently"
  }));

  return result.concat(removedRamls, addedRamls);
}
