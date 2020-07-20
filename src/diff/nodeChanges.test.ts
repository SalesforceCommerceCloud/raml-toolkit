/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "@oclif/test";
import { NodeChanges } from "./nodeChanges";
import { RuleCategory } from "./ruleSet";
import { CategorizedChange } from "./categorizedChange";

function buildNodeChanges(): NodeChanges {
  const categorizedChange = new CategorizedChange();
  categorizedChange.ruleName = "r1";
  categorizedChange.ruleEvent = "title-changed";
  categorizedChange.category = RuleCategory.BREAKING;
  categorizedChange.change = ["old-title", "new-title"];
  const nodeChanges = new NodeChanges("test-id", ["test:type"]);
  nodeChanges.categorizedChanges = [categorizedChange];
  return nodeChanges;
}

describe("Check for categorized changes in a node", () => {
  it("returns true when there are categorized changes", async () => {
    const nodeChanges = buildNodeChanges();
    expect(nodeChanges.hasCategorizedChanges()).to.equal(true);
  });

  it("returns false when the categorized changes are not defined", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges = undefined;
    expect(nodeChanges.hasCategorizedChanges()).to.equal(false);
  });

  it("returns false when the categorized changes are null", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges = null;
    expect(nodeChanges.hasCategorizedChanges()).to.equal(false);
  });

  it("returns false when the categorized changes are empty", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges = [];
    expect(nodeChanges.hasCategorizedChanges()).to.equal(false);
  });

  it("returns true when there are breaking changes", async () => {
    const nodeChanges = buildNodeChanges();
    expect(nodeChanges.hasBreakingChanges()).to.equal(true);
  });

  it("returns false when there are no breaking changes", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges[0].category = RuleCategory.NON_BREAKING;
    expect(nodeChanges.hasBreakingChanges()).to.equal(false);
  });

  it("returns false for breaking changes when the categorized changes are not defined", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges = undefined;
    expect(nodeChanges.hasBreakingChanges()).to.equal(false);
  });

  it("returns false for breaking changes when the categorized changes are null", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges = null;
    expect(nodeChanges.hasBreakingChanges()).to.equal(false);
  });
});

describe("Get number of categorized changes in a node", () => {
  it("returns breaking changes count", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges[0].category = RuleCategory.BREAKING;
    expect(nodeChanges.getBreakingChangesCount()).to.equal(1);
  });

  it("returns non-breaking changes count", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges[0].category = RuleCategory.NON_BREAKING;
    expect(nodeChanges.getNonBreakingChangesCount()).to.equal(1);
  });

  it("returns ignored changes count", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges[0].category = RuleCategory.IGNORED;
    expect(nodeChanges.getIgnoredChangesCount()).to.equal(1);
  });

  it("returns zero when the categorized changes are not defined", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges = undefined;
    expect(
      nodeChanges.getChangeCountByCategory(RuleCategory.BREAKING)
    ).to.equal(0);
  });

  it("returns zero when the categorized changes are null", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges = null;
    expect(
      nodeChanges.getChangeCountByCategory(RuleCategory.BREAKING)
    ).to.equal(0);
  });
});
