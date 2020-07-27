/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import _ from "lodash";
import jsYaml from "js-yaml";

export function mergeYamlFiles(...yamlFiles: string[]): string {
  const yaml = yamlFiles.map(file => jsYaml.safeLoad(file));
  return _.merge({}, ...yaml);
}
