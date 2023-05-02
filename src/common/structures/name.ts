/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import _ from "lodash";

// x-salesforce-sdk-class-name: custom field to set name in RAML
export const CUSTOM_NAME_FIELD = "salesforce-sdk-class-name";

/**
 * Stores a name with common transformations cached for use in templates and file paths.
 */
export class Name {
  original = "";
  kebabCase = "";
  lowerCamelCase = "";
  snakeCase = "";
  upperCamelCase = "";

  constructor(name: string) {
    if (name) {
      this.original = name;
      this.kebabCase = _.kebabCase(name);
      this.lowerCamelCase = _.camelCase(name);
      this.snakeCase = _.snakeCase(name);
      this.upperCamelCase = _.upperFirst(_.camelCase(name));
    }
    Object.freeze(this);
  }

  toString(): string {
    return this.original;
  }
}
