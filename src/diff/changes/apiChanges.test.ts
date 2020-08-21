/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "chai";
import { NodeChanges } from "./nodeChanges";
import { RuleCategory } from "../ruleCategory";
import { CategorizedChange } from "./categorizedChange";
import { ApiChanges, ApiChangesTemplateData } from "./apiChanges";

function buildCategorizedChange(
  c = RuleCategory.BREAKING,
  id = 0
): CategorizedChange {
  const rule = `${c} Rule ${id}`;
  return new CategorizedChange(rule, "title-changed", c, ["old", "new"]);
}

function buildNodeChanges(
  categories = [RuleCategory.BREAKING],
  id = 0
): NodeChanges {
  const nodeChanges = new NodeChanges(`test-id-${id}`, ["type:title"]);
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
    const apiChanges = buildApiChanges([]);
    expect(apiChanges.hasChanges()).to.be.false;
  });
});

describe("Checks for categorized changes in a API", () => {
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

  it("returns boolean indicating whether there are categorized changes", () => {
    const hasChanges = buildApiChanges();
    expect(hasChanges.hasCategorizedChanges()).to.be.true;
    const noChanges = buildApiChanges([]);
    expect(noChanges.hasCategorizedChanges()).to.be.false;
    const uncategorizedChanges = buildApiChanges();
    uncategorizedChanges.nodeChanges[0].categorizedChanges = [];
    expect(uncategorizedChanges.hasCategorizedChanges()).to.be.false;
  });
});

describe("Summary of API changes by category", () => {
  it("returns all categories as zero with no changes", () => {
    const apiChanges = buildApiChanges([]);
    const summary = apiChanges.getCategorySummary();
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
    const summary = apiChanges.getCategorySummary();
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
    const summary = apiChanges.getCategorySummary();
    expect(summary).to.deep.equal({
      [RuleCategory.BREAKING]: 2,
      [RuleCategory.IGNORED]: 2,
      [RuleCategory.NON_BREAKING]: 1,
    });
  });
});

describe("ApiChanges template data format", () => {
  let templateData: ApiChangesTemplateData;

  before("getTemplateData", () => {
    const apiChanges = buildApiChanges([
      [RuleCategory.BREAKING, RuleCategory.IGNORED],
      [RuleCategory.NON_BREAKING, RuleCategory.BREAKING],
      [RuleCategory.IGNORED],
    ]);
    templateData = apiChanges.getTemplateData();
  });

  it("has changes and a summary", () => {
    expect(templateData.apiSummary).to.have.keys(Object.values(RuleCategory));
    expect(templateData.nodeChanges).to.be.an("array");
  });
});

describe("ApiChanges string formatter", () => {
  const apiChanges = buildApiChanges();

  it("returns JSON when specified", () => {
    expect(apiChanges.toFormattedString("json")).to.equal(
      `${JSON.stringify(apiChanges)}`
    );
  });

  it("returns a console format", () => {
    expect(apiChanges.toFormattedString("console")).to.be.a("string");
  });

  it("throws when a format is invalid", () => {
    expect(() => apiChanges.toFormattedString("invalid format")).to.throw(
      'Could not render format "invalid format":'
    );
  });
});

describe("ApiChanges console-formatted string", () => {
  let text: string;

  before("toConsoleString", () => {
    const apiChanges = buildApiChanges([
      [RuleCategory.BREAKING, RuleCategory.IGNORED],
      [RuleCategory.NON_BREAKING, RuleCategory.BREAKING],
      [RuleCategory.IGNORED],
    ]);
    text = apiChanges.toFormattedString("console");
  });

  it("says no changes when there are no changes", () => {
    const noChanges = buildApiChanges([]);
    expect(noChanges.toFormattedString("console")).to.equal("No changes.\n");
  });

  it("lists changed node IDs", () => {
    expect(text)
      .to.include("test-id-0")
      .and.to.include("test-id-1")
      .and.not.include("test-id-2"); // Only has ignored changes
  });

  it("lists modified values", () => {
    // splitting is the cleanest way I can think of to count occurrences
    expect(text.split("old → new")).to.have.lengthOf(4);
  });

  it("lists category for each non-ignored change", () => {
    // splitting is the cleanest way I can think of to count occurrences
    expect(text.split("[Breaking]")).to.have.lengthOf(3);
    expect(text.split("[Non-Breaking]")).to.have.lengthOf(2);
    expect(text).to.not.include("[Ignored]");
  });

  it("lists non-ignored rule IDs", () => {
    expect(text)
      .to.include("Breaking Rule 0")
      .and.include("Non-Breaking Rule 0")
      .and.include("Breaking Rule 1");
  });

  it("omits ignored rule IDs", () => {
    expect(text)
      .to.not.include("Ignored Rule 0")
      .and.not.include("Ignored Rule 1");
  });

  it("lists all categories and counts in the summary", () => {
    expect(text)
      .to.include("Breaking Changes: 2")
      .and.include("Non-Breaking Changes: 1")
      .and.include("Ignored Changes: 2");
  });

  it("omits unused categories from summary", () => {
    const noIgnored = buildApiChanges([
      [RuleCategory.BREAKING],
      [RuleCategory.NON_BREAKING],
    ]);
    expect(noIgnored.toFormattedString("console"))
      .to.include("Breaking Changes: 1")
      .and.include("Non-Breaking Changes: 1")
      .and.not.include("Ignored Changes:");
  });
});
