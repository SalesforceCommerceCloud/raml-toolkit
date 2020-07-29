/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from "path";
import { ramlToolLogger } from "../common/logger";
import { ApiDifferencer } from "./apiDifferencer";
import { ApiCollectionChanges } from "./changes/apiCollectionChanges";

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
 * @param apiCollectionChanges - Instance of ApiCollectionChanges
 * @returns An array of differences
 */
async function diffCommonRamls(
  dir1: string,
  dir2: string,
  commonRamls: string[],
  apiCollectionChanges: ApiCollectionChanges
): Promise<void> {
  for (const raml of commonRamls) {
    const leftRaml = path.join(dir1, raml);
    const rightRaml = path.join(dir2, raml);
    try {
      const apiDifferencer = new ApiDifferencer(leftRaml, rightRaml);
      apiCollectionChanges.changed[
        raml
      ] = await apiDifferencer.findAndCategorizeChanges();
    } catch (error) {
      ramlToolLogger.error(`Diff operation for '${raml}' failed:`, error);
      apiCollectionChanges.errored[raml] = error.message;
    }
  }
}

/**
 * Finds differences between the given directories for all the raml files in the
 * provided config.
 *
 * @param baseConfigFile - Existing APIs
 * @param newConfigFile - Newly downloaded APIs
 *
 * @returns An array of RamlDiff objects containing differences between all the
 * old and new RAML files
 */
export async function diffRamlDirectories(
  baseConfigFile: string,
  newConfigFile: string
): Promise<ApiCollectionChanges> {
  const baseApiDir = path.dirname(baseConfigFile);
  const newApiDir = path.dirname(newConfigFile);
  const baseRamls = listRamlsFromConfig(baseConfigFile);
  const newRamls = listRamlsFromConfig(newConfigFile);
  const ramls = getCommonAndUniqueElements(baseRamls, newRamls);

  const apiCollectionChanges = new ApiCollectionChanges(
    baseConfigFile,
    newConfigFile
  );
  await diffCommonRamls(
    baseApiDir,
    newApiDir,
    ramls.common,
    apiCollectionChanges
  );
  apiCollectionChanges.removed = ramls.unique[0];
  apiCollectionChanges.added = ramls.unique[1];

  return apiCollectionChanges;
}
