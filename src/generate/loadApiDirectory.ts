/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from "fs-extra";
import path from "path";
import { ApiMetadata } from "./";
import { ApiModel } from "./";

/**
 * @description - Given a directory and recursively parse all apis and their metadata in those directories
 * NOTE: This exists outside ApiMetadata and ApiModel to prevent circular dependencies.
 *
 * @export
 * @param {string} apiPath - The path to the root of the apis.
 * @returns {ApiMetadata} - The created node for the tree
 */
// generate.ts from isomorphic SDK calls this
export function loadApiDirectory(apiPath: string): ApiMetadata {
  if (!fs.pathExistsSync(apiPath)) {
    throw new Error(`${apiPath} Api path does not exist`);
  }

  // If we have an exchange.json we are loading an API
  if (fs.existsSync(path.join(apiPath, "exchange.json"))) {
    console.log('API PATH HERE: ', apiPath)
    // create a new API model based on the apiPath
    return new ApiModel(path.basename(apiPath), apiPath);
  }

  const children = fs
    .readdirSync(apiPath)
    // Skip non-directories
    .filter((entry) => fs.lstatSync(path.join(apiPath, entry)).isDirectory())
    .map((dir) => loadApiDirectory(path.join(apiPath, dir)));

  return new ApiMetadata(path.basename(apiPath), apiPath, children);
}
