/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "chai";
import { NodeChanges } from "./nodeChanges";
import { RuleCategory } from "./ruleSet";
import { CategorizedChange } from "./categorizedChange";
import { ApiChanges } from "./apiChanges";

function buildApiChanges(): ApiChanges {
  const titleChange = new CategorizedChange();
  titleChange.ruleName = "r1";
  titleChange.ruleEvent = "title-changed";
  titleChange.category = RuleCategory.BREAKING;
  titleChange.change = ["old-title", "new-title"];
  const nodeChanges = new NodeChanges("test-id-1", ["type:title"]);
  nodeChanges.categorizedChanges = [titleChange];

  return new ApiChanges("base.raml", "new.raml", [nodeChanges]);
}
describe("Check for changes in the API", () => {
  it("returns true when there are changes", async () => {
    const apiChanges = buildApiChanges();
    expect(apiChanges.hasChanges()).to.equal(true);
  });

  it("returns false when the changes not defined", async () => {
    const apiChanges = new ApiChanges("baseApi.raml", "newApi.raml", undefined);
    expect(apiChanges.hasChanges()).to.equal(false);
  });

  it("returns false when the changes are null", async () => {
    const apiChanges = new ApiChanges("baseApi.raml", "newApi.raml", null);
    expect(apiChanges.hasChanges()).to.equal(false);
  });

  it("returns false when the node changes array is empty", async () => {
    const apiChanges = new ApiChanges("baseApi.raml", "newApi.raml", []);
    expect(apiChanges.hasChanges()).to.equal(false);
  });
});

describe("Check for categorized changes in a API", () => {
  it("returns categorized changes", async () => {
    const apiChanges = buildApiChanges();
    expect(apiChanges.getCategorizedChanges()).to.deep.equal(
      apiChanges.nodeChanges
    );
  });

  it("returns true when there are breaking changes", async () => {
    const apiChanges = buildApiChanges();
    expect(apiChanges.hasBreakingChanges()).to.equal(true);
  });

  it("returns false when there are no breaking changes", async () => {
    const apiChanges = buildApiChanges();
    apiChanges.nodeChanges[0].categorizedChanges[0].category =
      RuleCategory.NON_BREAKING;
    expect(apiChanges.hasBreakingChanges()).to.equal(false);
  });

  it("returns breaking changes count", async () => {
    const apiChanges = buildApiChanges();
    expect(apiChanges.getBreakingChangesCount()).to.equal(1);
  });

  it("returns non-breaking changes count", async () => {
    const apiChanges = buildApiChanges();
    apiChanges.nodeChanges[0].categorizedChanges[0].category =
      RuleCategory.NON_BREAKING;
    expect(apiChanges.getNonBreakingChangesCount()).to.equal(1);
  });

  it("returns ignored changes count", async () => {
    const apiChanges = buildApiChanges();
    apiChanges.nodeChanges[0].categorizedChanges[0].category =
      RuleCategory.IGNORED;
    expect(apiChanges.getIgnoredChangesCount()).to.equal(1);
  });
});
