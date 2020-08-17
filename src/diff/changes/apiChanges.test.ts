/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "chai";
import { NodeChanges } from "./nodeChanges";
import { RuleCategory } from "../ruleSet";
import { CategorizedChange } from "./categorizedChange";
import { ApiChanges } from "./apiChanges";

function buildCategorizedChange(c = RuleCategory.BREAKING): CategorizedChange {
  return new CategorizedChange("r1", "title-changed", c, ["old", "new"]);
}

function buildNodeChanges(categories = [RuleCategory.BREAKING]): NodeChanges {
  const nodeChanges = new NodeChanges("test-id-1", ["type:title"]);
  nodeChanges.categorizedChanges = categories.map(buildCategorizedChange);
  return nodeChanges;
}

function buildApiChanges(categories = [[RuleCategory.BREAKING]]): ApiChanges {
  const apiChanges = new ApiChanges("base.raml", "new.raml");
  apiChanges.nodeChanges = categories.map(buildNodeChanges);
  return apiChanges;
}

describe("Create an instance of ApiChanges", () => {
  it("creates ApiChanges object", async () => {
    const apiChanges = new ApiChanges("baseApiSpec", "newApiSpec");

    expect(apiChanges).to.be.an.instanceof(ApiChanges);
    expect(apiChanges.baseApiSpec).to.equal("baseApiSpec");
    expect(apiChanges.newApiSpec).to.equal("newApiSpec");
    expect(apiChanges.nodeChanges).to.deep.equal([]);
  });
});

describe("Check for changes in the API", () => {
  it("returns true when there are changes", async () => {
    const apiChanges = buildApiChanges();
    expect(apiChanges.hasChanges()).to.be.true;
  });

  it("returns false when the node changes array is empty", async () => {
    const apiChanges = new ApiChanges("baseApi.raml", "newApi.raml");
    expect(apiChanges.hasChanges()).to.be.false;
  });
});

describe("Check for categorized changes in a API", () => {
  it("returns categorized changes", async () => {
    const apiChanges = buildApiChanges();
    expect(apiChanges.getNodesWithCategorizedChanges()).to.deep.equal(
      apiChanges.nodeChanges
    );
  });

  it("returns true when there are breaking changes", async () => {
    const apiChanges = buildApiChanges();
    expect(apiChanges.hasBreakingChanges()).to.be.true;
  });

  it("returns false when there are no breaking changes", async () => {
    const apiChanges = buildApiChanges([[RuleCategory.NON_BREAKING]]);
    expect(apiChanges.hasBreakingChanges()).to.be.false;
  });

  it("returns breaking changes count", async () => {
    const apiChanges = buildApiChanges();
    expect(apiChanges.getBreakingChangesCount()).to.equal(1);
  });

  it("returns non-breaking changes count", async () => {
    const apiChanges = buildApiChanges([[RuleCategory.NON_BREAKING]]);
    expect(apiChanges.getNonBreakingChangesCount()).to.equal(1);
  });

  it("returns ignored changes count", async () => {
    const apiChanges = buildApiChanges([[RuleCategory.IGNORED]]);
    expect(apiChanges.getIgnoredChangesCount()).to.equal(1);
  });
});

describe("Summary of API changes by category", () => {
  it("returns all categories as zero with no changes", () => {
    const apiChanges = buildApiChanges([]);
    const summary = apiChanges.getCategorizedChangeSummary();
    expect(summary).to.deep.equal({
      [RuleCategory.BREAKING]: 0,
      [RuleCategory.IGNORED]: 0,
      [RuleCategory.NON_BREAKING]: 0,
    });
  });

  it("returns a summary for a single changed node", () => {
    const apiChanges = buildApiChanges([
      [RuleCategory.BREAKING, RuleCategory.IGNORED, RuleCategory.BREAKING],
    ]);
    const summary = apiChanges.getCategorizedChangeSummary();
    expect(summary).to.deep.equal({
      [RuleCategory.BREAKING]: 2,
      [RuleCategory.IGNORED]: 1,
      [RuleCategory.NON_BREAKING]: 0,
    });
  });

  it("returns a summary for multiple changed nodes", () => {
    const apiChanges = buildApiChanges([
      [RuleCategory.BREAKING, RuleCategory.IGNORED],
      [RuleCategory.BREAKING, RuleCategory.NON_BREAKING],
      [RuleCategory.IGNORED],
    ]);
    const summary = apiChanges.getCategorizedChangeSummary();
    expect(summary).to.deep.equal({
      [RuleCategory.BREAKING]: 2,
      [RuleCategory.IGNORED]: 2,
      [RuleCategory.NON_BREAKING]: 1,
    });
  });
});
