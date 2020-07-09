/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { ApiGroup } from "./apiGroup";

/**
 * A collection of multiple groups of APIs.
 */
export class ApiCollection extends Array<ApiGroup> {
  constructor(groups: ApiGroup[]) {
    super(...groups);
  }

  /**
   * Loads an entire collection of APIs from a simple description format.
   *
   * @param description - a simple object literal with group names as
   * properties and a list of file paths under each group
   */
  static async init(description: {
    [key: string]: string[];
  }): Promise<ApiCollection> {
    const promises: Promise<ApiGroup>[] = Object.entries(
      description
    ).map(([group, paths]) => ApiGroup.init(paths, group));

    return new this(await Promise.all(promises));
  }

  /**
   * Searches the collection for a particular API Group by name.
   *
   * @param name - Name of the API group to return from the collection
   */
  get(name: string): ApiGroup {
    return this.find(g => g.name.original === name);
  }
}
