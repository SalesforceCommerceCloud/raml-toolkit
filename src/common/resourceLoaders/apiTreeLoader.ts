/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from "fs-extra";
import path from "path";
import { createApi } from "../structures/api";
import { ApiMetadata } from "../structures/apiMetadata";
import { ApiTree } from "../structures/apiTree";

/**
 * Given a directory parse all apis and their metadata in those directories
 *
 * @param apiPath - The path to the root of the apis.
 */
export async function createApiTree(apiPath: string): Promise<ApiTree> {
  if (!fs.pathExistsSync(apiPath)) {
    throw `${apiPath} Api path does not exist`;
  }

  // If we have an exchange.json we are loading an API
  if (fs.existsSync(path.join(apiPath, "exchange.json"))) {
    return createApi(apiPath);
  }

  const promises: Promise<ApiTree>[] = fs
    .readdirSync(apiPath)
    .map(dir => createApiTree(path.join(apiPath, dir)));
  return new ApiMetadata(apiPath, await Promise.all(promises));
}
