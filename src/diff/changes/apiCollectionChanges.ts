/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";
import { ApiChanges, ApiChangesTemplateData } from "./apiChanges";
import { createCategorySummary, CategorySummary } from "../ruleCategory";
import { Formatter } from "../formatter";

/**
 * ApiCollectionChanges data in a format more easily consumed by Handlebars templates
 */
export type ApiCollectionChangesTemplateData = {
  changed: { name: string; apiChanges: ApiChangesTemplateData }[];
  added: string[];
  removed: string[];
  errored: { name: string; error: string }[];
  hasChanges: boolean;
  // Property is categorySummary instead of summary (as in classes) to indicate
  // that it is not a summary of changed/added/removed/errored
  categorySummary: CategorySummary;
};

/**
 * Hold the differencing result of API collections
 */
export class ApiCollectionChanges {
  static formatter = new Formatter<ApiCollectionChangesTemplateData>();

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

  /**
   * Gets the number of changes in each category
   */
  getCategorySummary(): CategorySummary {
    return Object.values(this.changed).reduce((summary, api) => {
      const apiSummary = api.getCategorySummary();
      Object.entries(apiSummary).forEach(([category, count]) => {
        summary[category] += count;
      });
      return summary;
    }, createCategorySummary());
  }

  /**
   * Returns data in a format more easily consumed by Handlebars templates
   */
  getTemplateData(): ApiCollectionChangesTemplateData {
    // {key, value}[] has a length property, which makes counting entries easier
    // than for a plain object
    const changed = Object.entries(this.changed).map(([name, apiChanges]) => {
      return { name, apiChanges: apiChanges.getTemplateData() };
    });

    const errored = Object.entries(this.errored).map(([name, error]) => {
      return { name, error };
    });

    return {
      changed,
      added: this.added,
      removed: this.removed,
      errored,
      hasChanges: this.hasChanges(),
      categorySummary: this.getCategorySummary(),
    };
  }

  /**
   * Render the changes as a formatted string
   * @param format - Name of the format to use
   * @param apiChangesFormat - The format to use for individual API changes, if
   * necessary for the given API collection format. If not required, must be
   * explicitly set to `null`.
   * @see DiffCommand for a list of supported formats
   */
  toFormattedString(
    format: string,
    apiChangesFormat: string | null = format
  ): string {
    try {
      if (format === "json") {
        return JSON.stringify(this);
      }
      if (apiChangesFormat) {
        ApiCollectionChanges.formatter.registerPartial(
          path.join(
            Formatter.TEMPLATES_DIR,
            `ApiChanges.${apiChangesFormat}.hbs`
          )
        );
      }
      return ApiCollectionChanges.formatter.render(
        path.join(
          Formatter.TEMPLATES_DIR,
          `ApiCollectionChanges.${format}.hbs`
        ),
        this.getTemplateData()
      );
    } catch (err) {
      err.message = `Could not render format "${format}": ${err.message}`;
      throw err;
    }
  }
}
