/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Api } from "./api";
import { Name } from "./name";

/**
 * A group of API objects. Common transformations of the group name are cached
 * for reference in templates and file paths.
 */
export class ApiGroup {
  apis: Api[];
  name: Name;

  constructor(name = "", apis: Api[] = []) {
    this.name = new Name(name);
    this.apis = apis;
  }

  /**
   * Create a group from a list of API spec files. This is static and not a
   * constructor because it is async. Files are processed in parallel.
   *
   * @param apiSpecFilePaths - a list of paths to API spec files like RAML
   * @param name - the name of this group
   */
  static async init(apiSpecFilePaths: string[], name = ""): Promise<ApiGroup> {
    return new ApiGroup(
      name,
      await Promise.all(apiSpecFilePaths.map(p => Api.init(p, name)))
    );
  }
}
