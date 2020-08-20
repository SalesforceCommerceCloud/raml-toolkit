/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "@oclif/test";
import { RuleCategory } from "../ruleCategory";
import { CategorizedChange } from "./categorizedChange";

describe("CategorizedChange constructor", () => {
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

describe("CategorizedChange template data format", () => {
  it("has a name, category, and change", () => {
    const change = new CategorizedChange(
      "r1",
      "rule-event",
      RuleCategory.IGNORED
    );
    const templateData = change.getTemplateData();
    expect(templateData).to.deep.equal({
      ruleName: "r1",
      category: RuleCategory.IGNORED,
      change: {},
    });
  });

  it("indicates a single value when change only has a new value", () => {
    const change = new CategorizedChange(
      "Something Added",
      "addition",
      RuleCategory.BREAKING,
      [undefined, "added value"]
    );
    const templateData = change.getTemplateData();
    expect(templateData.change).to.deep.equal({ single: "added value" });
  });

  it("indicates a single value when a change only has an old value", () => {
    const change = new CategorizedChange(
      "Something Removed",
      "removatron-5000",
      RuleCategory.NON_BREAKING,
      ["deleted value", undefined]
    );
    const templateData = change.getTemplateData();
    expect(templateData.change).to.deep.equal({ single: "deleted value" });
  });

  it("indicates multiple values when a change has an old and new value", () => {
    const change = new CategorizedChange(
      "Haircut",
      "haircut",
      RuleCategory.BREAKING,
      ["long", "short"]
    );
    const templateData = change.getTemplateData();
    expect(templateData.change).to.deep.equal({ multiple: ["long", "short"] });
  });

  it("indicates no values when a change has no values (is ignored)", () => {
    const change = new CategorizedChange(
      "Ignore Me",
      "who cares?",
      RuleCategory.IGNORED
    );
    const templateData = change.getTemplateData();
    expect(templateData.change).to.deep.equal({});
  });
});
