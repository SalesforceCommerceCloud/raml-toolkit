/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "chai";
import { NodeChanges } from "./nodeChanges";
import { ApiChanges } from "./apiChanges";
import { ApiCollectionChanges } from "./apiCollectionChanges";
import { CategorizedChange } from "./categorizedChange";
import { RuleCategory } from "../ruleCategory";

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

function buildApiCollectionChanges(
  changed?: ApiCollectionChanges["changed"]
): ApiCollectionChanges {
  const changes = new ApiCollectionChanges("baseApiConfig", "newApiConfig");
  changes.changed = changed || {};
  return changes;
}

describe("Create an instance of ApiCollectionChanges", () => {
  it("creates ApiCollectionChanges object", async () => {
    const apiCollectionChanges = buildApiCollectionChanges();

    expect(apiCollectionChanges).to.be.an.instanceof(ApiCollectionChanges);
    expect(apiCollectionChanges.basePath).to.equal("baseApiConfig");
    expect(apiCollectionChanges.newPath).to.equal("newApiConfig");
  });
});

describe("Check for changes in api collection", () => {
  it("returns true when there are changes", async () => {
    const apiCollectionChanges = buildApiCollectionChanges();
    apiCollectionChanges.changed["base.raml"] = buildApiChanges();
    expect(apiCollectionChanges.hasChanges()).to.be.true;
  });

  it("returns true when there are removed apis", async () => {
    const apiCollectionChanges = buildApiCollectionChanges();
    apiCollectionChanges.removed = ["test.raml"];
    expect(apiCollectionChanges.hasChanges()).to.be.true;
  });

  it("returns true when there are added apis", async () => {
    const apiCollectionChanges = buildApiCollectionChanges();
    apiCollectionChanges.added = ["test.raml"];
    expect(apiCollectionChanges.hasChanges()).to.be.true;
  });

  it("returns false when the changes are not defined", async () => {
    const apiCollectionChanges = buildApiCollectionChanges();
    expect(apiCollectionChanges.hasChanges()).to.be.false;
  });

  it("returns false when the changes are empty", async () => {
    const apiCollectionChanges = buildApiCollectionChanges();
    expect(apiCollectionChanges.hasChanges()).to.be.false;
  });
});

describe("Check for failures on api collection diff", () => {
  it("returns true when there are failures", async () => {
    const apiCollectionChanges = buildApiCollectionChanges();
    apiCollectionChanges.errored["test.raml"] = "test-error";
    expect(apiCollectionChanges.hasErrors()).to.be.true;
  });

  it("returns false when the failures are empty", async () => {
    const apiCollectionChanges = buildApiCollectionChanges();
    expect(apiCollectionChanges.hasErrors()).to.be.false;
  });
});

describe("Summary of API changes by category", () => {
  it("returns all categories as zero with no changes", () => {
    const apiCollectionChanges = buildApiCollectionChanges();
    const summary = apiCollectionChanges.getCategorizedChangeSummary();
    expect(summary).to.deep.equal({
      [RuleCategory.BREAKING]: 0,
      [RuleCategory.IGNORED]: 0,
      [RuleCategory.NON_BREAKING]: 0,
    });
  });

  it("returns a summary for a single changed APIs", () => {
    const apiCollectionChanges = buildApiCollectionChanges({
      "test.raml": buildApiChanges([
        [RuleCategory.IGNORED, RuleCategory.BREAKING, RuleCategory.BREAKING],
      ]),
    });
    const summary = apiCollectionChanges.getCategorizedChangeSummary();
    expect(summary).to.deep.equal({
      [RuleCategory.BREAKING]: 2,
      [RuleCategory.IGNORED]: 1,
      [RuleCategory.NON_BREAKING]: 0,
    });
  });

  it("returns a summary for multiple changed APIs", () => {
    const apiCollectionChanges = buildApiCollectionChanges({
      "breaking.raml": buildApiChanges([[RuleCategory.BREAKING]]),
      "ignored.raml": buildApiChanges([
        [RuleCategory.IGNORED],
        [RuleCategory.IGNORED],
      ]),
      "mixed.raml": buildApiChanges([
        [RuleCategory.BREAKING, RuleCategory.NON_BREAKING],
      ]),
    });
    const summary = apiCollectionChanges.getCategorizedChangeSummary();
    expect(summary).to.deep.equal({
      [RuleCategory.BREAKING]: 2,
      [RuleCategory.IGNORED]: 2,
      [RuleCategory.NON_BREAKING]: 1,
    });
  });
});

describe("ApiCollectionChanges console formatted string", () => {
  let apiCollectionChanges: ApiCollectionChanges;
  let text: string;

  before(() => {
    apiCollectionChanges = buildApiCollectionChanges({
      "breaking-change.raml": buildApiChanges([[RuleCategory.BREAKING]]),
      "ignored-change.raml": buildApiChanges([
        [RuleCategory.IGNORED],
        [RuleCategory.IGNORED],
      ]),
      "mixed-changes.raml": buildApiChanges([
        [RuleCategory.BREAKING, RuleCategory.NON_BREAKING],
      ]),
    });
    apiCollectionChanges.added = ["added.raml"];
    apiCollectionChanges.removed = ["removed.raml"];
    apiCollectionChanges.errored = {
      "errored.raml": "Something bad happened!",
    };
    text = apiCollectionChanges.toString();
  });

  it("says no changes when there are no changes", () => {
    const noChanges = buildApiCollectionChanges();
    expect(noChanges.toString()).to.equal("No changes found.");
  });

  it("can be indented", () => {
    const indented = apiCollectionChanges.toString(2);
    for (const line of indented.split(/\n+/)) {
      if (line !== "") expect(line).to.match(/^  /); // Starts with 2 spaces
    }
  });

  it("lists all added APIs", () => {
    expect(text).to.include("added.raml");
  });

  it("lists all removed APIs", () => {
    expect(text).to.include("removed.raml");
  });

  it("lists all changed APIs", () => {
    expect(text)
      .to.include("File: breaking-change.raml")
      .and.include("File: ignored-change.raml")
      .and.include("File: mixed-changes.raml");
  });

  it("lists APIs with only ignored changes", () => {
    expect(text).to.include("File: ignored-change.raml");
  });

  it("lists all errored APIs and error messages", () => {
    expect(text).to.include("errored.raml: Something bad happened!");
  });

  it("lists all differences and counts in the summary", () => {
    expect(text)
      .to.include("APIs Changed: 3")
      .and.include("APIs Added: 1")
      .and.include("APIs Removed: 1")
      .and.include("Parsing Errors: 1");
  });

  it("lists all rule categories and counts in the summary", () => {
    expect(text)
      // "- " prefix included to distinguish from changed API summaries
      .to.include("- Breaking Changes: 2")
      .and.include("- Non-Breaking Changes: 1")
      .and.include("- Ignored Changes: 2");
  });

  it("omits unused differences from the summary", () => {
    const addedOnly = buildApiCollectionChanges();
    addedOnly.added = ["added.raml"];
    expect(addedOnly.toString())
      .to.include("APIs Added: 1")
      .and.not.include("APIs Removed:")
      .and.not.include("APIs Changed:")
      .and.not.include("Parsing Errors:");
  });

  it("omits unused rule categories from the summary", () => {
    const breakingChangesOnly = buildApiCollectionChanges({
      "changed.raml": buildApiChanges(),
    });
    expect(breakingChangesOnly.toString())
      .to.include("- Breaking Changes: 1")
      .and.not.include("- Non-Breaking Changes:")
      .and.not.include("- Ignored Changes:");
  });
});
