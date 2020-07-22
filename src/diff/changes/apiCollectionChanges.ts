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
  changed: Map<string, ApiChanges>;

  //Map of api name to its error message
  errored: Map<string, string>;

  //array of removed apis
  removed: string[];

  //array of added apis
  added: string[];

  /**
   * Return true when there are changes in the API collection
   */
  hasChanges(): boolean {
    return (
      (this.changed != null && this.changed.size > 0) ||
      (this.removed != null && this.removed.length > 0) ||
      (this.added != null && this.added.length > 0)
    );
  }

  /**
   * Return true if the diff on one or more apis has failed
   */
  hasErrors(): boolean {
    return this.errored != null && this.errored.size > 0;
  }
}
