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
  //holds api name and its changes
  changed: { [key: string]: ApiChanges };

  //holds api name to its error message
  errored: { [key: string]: string };

  //array of removed apis
  removed: string[];

  //array of added apis
  added: string[];

  /**
   * Create object to hold changes to two api collections
   * @param basePath - Base API config file
   * @param newPath - New API config file
   */
  constructor(public basePath: string, public newPath: string) {
    this.changed = {};
    this.errored = {};
    this.removed = [];
    this.added = [];
  }

  /**
   * Return true when there are changes in the API collection
   */
  hasChanges(): boolean {
    if (this.removed.length > 0 || this.added.length > 0) {
      return true;
    }
    return Object.values(this.changed).some((apiChanges) =>
      apiChanges.hasChanges()
    );
  }

  /**
   * Return true if the diff on one or more apis has failed
   */
  hasErrors(): boolean {
    return Object.keys(this.errored).length > 0;
  }
}
