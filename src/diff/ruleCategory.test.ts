/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "chai";
import { createCategorySummary, RuleCategory } from "./ruleCategory";

describe("Rule category summary initializer", () => {
  it("creates an object with categories set to zero", () => {
    expect(createCategorySummary()).to.deep.equal({
      [RuleCategory.BREAKING]: 0,
      [RuleCategory.NON_BREAKING]: 0,
      [RuleCategory.IGNORED]: 0,
    });
  });
});
