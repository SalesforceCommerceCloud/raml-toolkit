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
    return Object.values(this.changed).some(apiChanges =>
      apiChanges.hasChanges()
    );
  }

  /**
   * Return true if the diff on one or more apis has failed
   */
  hasErrors(): boolean {
    return Object.keys(this.errored).length > 0;
  }

  /**
   * Format the changes as a string for printing to console
   *
   * @param extraIndent - Number of levels the headings should be nested
   */
  toString(extraIndent = 0): string {
    // Ensure passed value is a non-negative number
    extraIndent = Math.max(0, extraIndent) || 0;
    /**
     * Indents the first non-empty line by the sum of the amounts passed to this
     * function and the outer function. Also appends a newline.
     * @param baseIndent Base amount to indent
     * @param str String to indent
     * @returns The indented string
     */
    const indent = (baseIndent: number, str: string): string =>
      str.replace(/^\n*/, "$&" + " ".repeat(baseIndent + extraIndent)) + "\n";

    let out = "";

    const changedEntries = Object.entries(this.changed).filter(([, api]) =>
      api.hasCategorizedChanges()
    );
    for (const [name, api] of changedEntries) {
      out += indent(0, `\nAPI Changed: ${name}`);
      out += api.toString(2);
    }

    for (const name of this.added) {
      out += indent(0, `\nAPI Added: ${name}`);
    }

    for (const name of this.removed) {
      out += indent(0, `\nAPI Removed: ${name}`);
    }

    const erroredEntries = Object.entries(this.errored);
    for (const [name, error] of erroredEntries) {
      out += indent(0, `\nFailed to parse API: ${name}`);
      out += indent(2, error);
    }

    if (
      this.added.length ||
      this.removed.length ||
      changedEntries.length ||
      erroredEntries.length
    ) {
      out += indent(0, `\nSummary`);
      if (this.added.length) {
        out += indent(2, `${this.added.length} APIs added`);
      }
      if (this.removed.length) {
        out += indent(2, `${this.removed.length} APIs removed`);
      }
      if (changedEntries.length) {
        out += indent(2, `${changedEntries.length} APIs changed`);
      }
      if (erroredEntries.length) {
        out += indent(2, `${erroredEntries.length} parsing errors`);
      }
    } else {
      out += indent(0, `No changes found.`);
    }

    return out;
  }
}
