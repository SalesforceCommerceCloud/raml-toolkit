/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { readFileSync } from "fs-extra";

export class CommerceFileSystemAdapter {

  readFileSync(resourceAbsolutePath: string): string {
    return readFileSync(resourceAbsolutePath, "utf8");
  }
}
