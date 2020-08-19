/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "@oclif/test";
import { RuleCategory } from "../ruleCategory";
import { CategorizedChange } from "./categorizedChange";

describe("Create an instance of CategorizedChange", () => {
  it("creates a breaking change", async () => {
    const change = new CategorizedChange(
      "r1",
      "rule-event",
      RuleCategory.BREAKING,
      ["old-value", "new-value"]
    );
    expect(change).to.be.an.instanceof(CategorizedChange);
    expect(change.ruleName).to.equal("r1");
    expect(change.ruleEvent).to.equal("rule-event");
    expect(change.category).to.equal(RuleCategory.BREAKING);
    expect(change.change).to.deep.equal(["old-value", "new-value"]);
  });

  it("creates an ignored change", async () => {
    const change = new CategorizedChange(
      "r1",
      "rule-event",
      RuleCategory.IGNORED
    );
    expect(change).to.be.an.instanceof(CategorizedChange);
    expect(change.ruleName).to.equal("r1");
    expect(change.ruleEvent).to.equal("rule-event");
    expect(change.category).to.equal(RuleCategory.IGNORED);
  });

  it("throws error when there are no changed values for the breaking change", async () => {
    expect(
      () => new CategorizedChange("r1", "rule-event", RuleCategory.BREAKING)
    ).to.throw("Changed values are required");
  });
});
