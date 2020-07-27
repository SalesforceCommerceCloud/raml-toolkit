/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Name } from "./name";
import fs from "fs-extra";
import path from "path";

export class ApiTree {
  metadata: { [key: string]: any };

  constructor(
    public name: Name,
    protected filepath: string,
    protected children: ApiTree[]
  ) {
    if (fs.existsSync(path.join(filepath, `.metadata.json`))) {
      this.metadata = fs.readJSONSync(path.join(filepath, `.metadata.json`));
    }
  }

  public getChildren(): ApiTree[] {
    return this.children;
  }
}
