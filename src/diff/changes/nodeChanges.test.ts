/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "@oclif/test";
import { NodeChanges } from "./nodeChanges";
import { RuleCategory } from "../ruleCategory";
import { CategorizedChange } from "./categorizedChange";

function buildCategorizedChange(c = RuleCategory.BREAKING): CategorizedChange {
  return new CategorizedChange("r1", "title-changed", c, ["old", "new"]);
}

function buildNodeChanges(categories = [RuleCategory.BREAKING]): NodeChanges {
  const nodeChanges = new NodeChanges("test-id-1", ["type:title"]);
  nodeChanges.categorizedChanges = categories.map(buildCategorizedChange);
  return nodeChanges;
}

describe("Create an instance of NodeChanges", () => {
  it("creates NodeChanges object", async () => {
    const nodeChanges = new NodeChanges("test-id", ["test:type"]);

    expect(nodeChanges).to.be.an.instanceof(NodeChanges);
    expect(nodeChanges.id).to.equal("test-id");
    expect(nodeChanges.type).to.deep.equal(["test:type"]);
    expect(nodeChanges.added).to.deep.equal({});
    expect(nodeChanges.removed).to.deep.equal({});
    expect(nodeChanges.categorizedChanges).to.deep.equal([]);
  });
});

describe("Check for categorized changes in a node", () => {
  it("returns true when there are categorized changes", async () => {
    const nodeChanges = buildNodeChanges();
    expect(nodeChanges.hasCategorizedChanges()).to.be.true;
  });

  it("returns false when the categorized changes are empty", async () => {
    const nodeChanges = new NodeChanges("test-id", ["test:type"]);
    expect(nodeChanges.hasCategorizedChanges()).to.be.false;
  });

  it("returns true when there are breaking changes", async () => {
    const nodeChanges = buildNodeChanges();
    expect(nodeChanges.hasBreakingChanges()).to.be.true;
  });

  it("returns false when there are no breaking changes", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges[0].category = RuleCategory.NON_BREAKING;
    expect(nodeChanges.hasBreakingChanges()).to.be.false;
  });

  it("returns false for breaking changes when there are no categorized changes", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges = [];
    expect(nodeChanges.hasBreakingChanges()).to.be.false;
  });
});

describe("Check for ignored changes in a node", () => {
  it("returns false when there are no ignored changes", async () => {
    const nodeChanges = buildNodeChanges();
    expect(nodeChanges.hasCategorizedChanges()).to.be.true;
    expect(nodeChanges.hasIgnoredChanges()).to.be.false;
    expect(nodeChanges.getIgnoredChangesCount()).to.equal(0);
  });

  it("returns true when there exists only one ignored change", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges[0].category = RuleCategory.IGNORED;
    expect(nodeChanges.hasCategorizedChanges()).to.be.true;
    expect(nodeChanges.hasIgnoredChanges()).to.be.true;
    expect(nodeChanges.getIgnoredChangesCount()).to.equal(1);
  });

  it("returns true when there is an ignored change and a non breaking change", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges[0].category = RuleCategory.IGNORED;
    const nonBreakingChange = new CategorizedChange(
      "r2",
      "non-breaking-change",
      RuleCategory.NON_BREAKING,
      ["old-non-breaking", "new-non-breaking"]
    );
    nodeChanges.categorizedChanges.push(nonBreakingChange);
    expect(nodeChanges.hasCategorizedChanges()).to.be.true;
    expect(nodeChanges.hasIgnoredChanges()).to.be.true;
    expect(nodeChanges.hasBreakingChanges()).to.be.false;
    expect(nodeChanges.getIgnoredChangesCount()).to.equal(1);
  });

  it("returns true when there multiple ignored changes", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges[0].category = RuleCategory.IGNORED;
    const nonBreakingChange = new CategorizedChange(
      "r2",
      "non-breaking-change",
      RuleCategory.IGNORED,
      ["old-ignored-change", "new-ignored-change"]
    );
    nodeChanges.categorizedChanges.push(nonBreakingChange);
    expect(nodeChanges.hasCategorizedChanges()).to.be.true;
    expect(nodeChanges.hasIgnoredChanges()).to.be.true;
    expect(nodeChanges.hasBreakingChanges()).to.be.false;
    expect(nodeChanges.getIgnoredChangesCount()).to.equal(2);
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

  it("returns zero when there are no changes for a given category", async () => {
    const nodeChanges = buildNodeChanges();
    nodeChanges.categorizedChanges[0].category = RuleCategory.IGNORED;
    expect(
      nodeChanges.getChangeCountByCategory(RuleCategory.BREAKING)
    ).to.equal(0);
  });
});

describe("Summary of node changes by category", () => {
  it("returns all categories as zero with no changes", () => {
    const nodeChanges = buildNodeChanges([]);
    const summary = nodeChanges.getCategorySummary();
    expect(summary).to.deep.equal({
      [RuleCategory.BREAKING]: 0,
      [RuleCategory.IGNORED]: 0,
      [RuleCategory.NON_BREAKING]: 0,
    });
  });

  it("returns the total number of changes in each category", () => {
    const nodeChanges = buildNodeChanges([
      RuleCategory.BREAKING,
      RuleCategory.BREAKING,
      RuleCategory.IGNORED,
    ]);
    const summary = nodeChanges.getCategorySummary();
    expect(summary).to.deep.equal({
      [RuleCategory.BREAKING]: 2,
      [RuleCategory.IGNORED]: 1,
      [RuleCategory.NON_BREAKING]: 0,
    });
  });
});

describe("NodeChanges template data format", () => {
  it("includes ID, name, and summary", () => {
    const nodeChanges = buildNodeChanges();
    const templateData = nodeChanges.getTemplateData();
    expect(templateData.nodeId).to.equal("test-id-1");
    expect(templateData.nodeSummary).to.have.keys(Object.values(RuleCategory));
    expect(templateData.categorizedChanges).to.be.an("array").with.lengthOf(1);
  });

  it("excludes ignored changes from the changes list", () => {
    const nodeChanges = buildNodeChanges([RuleCategory.IGNORED]);
    const templateData = nodeChanges.getTemplateData();
    expect(templateData.categorizedChanges).to.deep.equal([]);
  });

  it("includes ignored changes in the summary", () => {
    const nodeChanges = buildNodeChanges([RuleCategory.IGNORED]);
    const templateData = nodeChanges.getTemplateData();
    expect(templateData.nodeSummary).to.haveOwnProperty(
      RuleCategory.IGNORED,
      1
    );
  });
});
