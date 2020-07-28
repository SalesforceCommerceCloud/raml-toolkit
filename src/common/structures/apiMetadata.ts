/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { ApiTree } from "./apiTree";
import { Name } from "./name";
import path from "path";

/**
 * A collection of APIs that contains metadata.
 */
export class ApiMetadata extends ApiTree {
  constructor(filepath: string, children?: ApiTree[]) {
    const name = new Name(path.basename(filepath));
    super(name, filepath, children);
  }
}
