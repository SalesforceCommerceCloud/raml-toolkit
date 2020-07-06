/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import _ from "lodash";

/**
 * Stores a name with common transformations cached for use in templates and file paths.
 */
export default class Name {
  private _original = "";
  private _kebabCase = "";
  private _lowerCamelCase = "";
  private _snakeCase = "";
  private _upperCamelCase = "";

  constructor(name = "") {
    this.original = name;
  }

  set original(name: string) {
    this._original = name;
    this._kebabCase = _.kebabCase(name);
    this._lowerCamelCase = _.camelCase(name);
    this._snakeCase = _.snakeCase(name);
    this._upperCamelCase = _.upperFirst(_.camelCase(name));
  }

  get original(): string {
    return this._original;
  }

  get kebabCase(): string {
    return this._kebabCase;
  }

  get lowerCamelCase(): string {
    return this._lowerCamelCase;
  }

  get snakeCase(): string {
    return this._snakeCase;
  }

  get upperCamelCase(): string {
    return this._upperCamelCase;
  }

  toString(): string {
    return this.original;
  }
}
