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
import { loadApiDirectory, ApiMetadata, ApiModel } from "../generate";

/**
 * Find differences between two ApiModel objects and writes them to the passed
 * ApiCollectionChanges object.
 *
 * @param leftApi - Left ApiModel to be compared
 * @param rightApi - Right ApiModel to be compared
 * @param changes - ApiCollectionChanges object to contain all the changes
 */
export async function diffApiModels(
  leftApi: ApiModel | undefined,
  rightApi: ApiModel | undefined,
  changes: ApiCollectionChanges
): Promise<void> {
  if (leftApi && rightApi) {
    try {
      const leftRaml = path.join(leftApi.path, leftApi.main);
      const rightRaml = path.join(rightApi.path, rightApi.main);
      const differencer = new ApiDifferencer(leftRaml, rightRaml);
      changes.changed[
        leftApi.main
      ] = await differencer.findAndCategorizeChanges();
    } catch (error) {
      ramlToolLogger.error(
        `Diff operation for '${leftApi.name}' failed:`,
        error
      );
      changes.errored[leftApi.main] = error.message;
    }
  } else if (rightApi) {
    changes.added.push(rightApi.main);
  } else if (leftApi) {
    changes.removed.push(leftApi.main);
  }
}

/**
 * Traverses the left and right api tree recursively to get the ApiModel left
 * nodes and then finds differences between them by running diff operation.
 *
 * @param leftNode - node of the left api tree to be compared
 * @param rightNode - node of the right api tree to be compared
 * @param changes - ApiCollectionChanges object to contain all the changes
 */
export async function diffApiMetadata(
  leftNode: ApiMetadata | undefined,
  rightNode: ApiMetadata | undefined,
  changes: ApiCollectionChanges
): Promise<void> {
  // If either of the nodes passed is an ApiModel object, then we have
  // traversed that tree branch entirely and can pass the APIs for diff to
  // be run upon
  if (
    (typeof leftNode === "undefined" || leftNode instanceof ApiModel) &&
    (typeof rightNode === "undefined" || rightNode instanceof ApiModel)
  ) {
    return diffApiModels(leftNode, rightNode, changes);
  }

  const leftChildren = leftNode ? leftNode.children : [];
  const rightChildren = rightNode ? rightNode.children : [];
  // Convert the right children array into a map so that we can easily look up
  // elements in the left array
  const rightMap = new Map(rightChildren.map((o) => [o.name.original, o]));
  for (const leftChild of leftChildren) {
    const rightChild = rightMap.get(leftChild.name.original);
    await diffApiMetadata(leftChild, rightChild, changes);
    // Once an element is found in the right map delete it so that in the end
    // we are only left with the elements unique to the right array
    rightMap.delete(leftChild.name.original);
  }
  // Process the objects only present in the right array
  for (const rightChild of rightMap.values()) {
    await diffApiMetadata(undefined, rightChild, changes);
  }
}

/**
 * Finds differences between the given directories for all the raml files.
 *
 * @param baseDir - Existing APIs
 * @param newDir - Newly downloaded APIs
 *
 * @returns An ApiCollectionChanges object containing all the changes
 */
export async function diffRamlDirectories(
  baseDir: string,
  newDir: string
): Promise<ApiCollectionChanges> {
  const baseApis = loadApiDirectory(baseDir);
  const newApis = loadApiDirectory(newDir);

  const apiCollectionChanges = new ApiCollectionChanges(baseDir, newDir);

  await diffApiMetadata(baseApis, newApis, apiCollectionChanges);

  return apiCollectionChanges;
}
