/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Name } from "./name";
import fs from "fs-extra";
import path from "path";
import { ramlToolLogger } from "../logger";

/*
 * Api Tree is an abstract class that represents the directory structure of several APIs
 *
 */
export abstract class ApiTree {
  metadata: { [key: string]: unknown };

  constructor(
    public name: Name,
    protected filepath: string,
    public children: ApiTree[] = []
  ) {
    if (fs.existsSync(path.join(filepath, `.metadata.json`))) {
      try {
        this.metadata = fs.readJSONSync(path.join(filepath, `.metadata.json`));
      } catch (e) {
        ramlToolLogger.warn(
          `Metadata found, but failed to load for ${filepath}`
        );
      }
    }
  }
}
