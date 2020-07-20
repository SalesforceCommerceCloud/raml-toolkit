/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { ApiChanges } from "./apiChanges";

/**
 * Hold the differencing result of API collections
 */
export class ApiCollectionChanges {
  //Map of api name to its changes
  changes: Map<string, ApiChanges>;

  //Map of api name to its error message
  failed: Map<string, string>;

  //array of removed apis
  removedApis: string[];

  //array of added apis
  addedApis: string[];

  /**
   * Return true when there are changes in the API collection
   */
  hasChanges(): boolean {
    return (
      (this.changes != null && this.changes.size > 0) ||
      (this.removedApis != null && this.removedApis.length > 0) ||
      (this.addedApis != null && this.addedApis.length > 0)
    );
  }

  /**
   * Return true if the diff on one or more apis has failed
   */
  hasFailures(): boolean {
    return this.failed != null && this.failed.size > 0;
  }
}
