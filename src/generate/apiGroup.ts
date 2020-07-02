/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import _ from "lodash";

import { Api } from "./api";

/**
 * A group of API objects. Common transformations of the group name are cached
 * for reference in templates and file paths.
 */
export class ApiGroup {
  apis: Api[];
  name: {
    original: string;
    kebabCase: string;
    lowerCamelCase: string;
    snakeCase: string;
    upperCamelCase: string;
  };

  constructor(name?: string) {
    this.setName(name);
  }

  /**
   * Create a group from a list of API spec files. This is static and not a
   * constructor because it is async. Files are processed in parallel.
   *
   * @param apiSpecFilePaths - a list of paths to API spec files like RAML
   */
  static async read(apiSpecFilePaths: string[]): Promise<ApiGroup> {
    const apiPromises: Promise<Api>[] = [];
    for (const apiSpecFilePath of apiSpecFilePaths) {
      apiPromises.push(Api.read(apiSpecFilePath));
    }
    await Promise.all(apiPromises);

    const apiGroup = new ApiGroup();
    apiGroup.apis = [];
    for (const p of apiPromises) {
      apiGroup.apis.push(await p);
    }
    return apiGroup;
  }

  setName(name = ""): ApiGroup {
    this.name = {
      original: name,
      kebabCase: _.kebabCase(name),
      lowerCamelCase: _.camelCase(name),
      snakeCase: _.snakeCase(name),
      upperCamelCase: _.upperFirst(_.camelCase(name))
    };

    return this;
  }
}
