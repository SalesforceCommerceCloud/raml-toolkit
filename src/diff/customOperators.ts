/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Operator } from "json-rules-engine";

const customOperators: Operator[] = [];

customOperators.push(
  new Operator("hasProperty", (factValue: object, jsonValue: string) =>
    factValue.hasOwnProperty(jsonValue)
  )
);
customOperators.push(
  new Operator(
    "hasNoProperty",
    (factValue: object, jsonValue: string) =>
      !factValue.hasOwnProperty(jsonValue)
  )
);

export default customOperators;
