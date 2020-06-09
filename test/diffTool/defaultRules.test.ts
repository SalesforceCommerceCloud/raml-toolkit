/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { NodeDiff } from "../../src/diffTool/jsonDiff";
import * as chai from "chai";
import { applyRules } from "../../src/diffTool/rulesProcessor";
import * as path from "path";

const expect = chai.expect;

const defaultRulesPath = path.join(
  __dirname,
  "../../diffRules",
  "defaultRules.json"
);

describe("Display name change", () => {
  it("applies display name change rule ", async () => {
    const diff: NodeDiff = {
      id: "#/web-api/end-points/resource/get",
      type: ["apiContract:Operation"],
      added: { "core:name": "newName" },
      removed: { "core:name": "oldName" }
    };
    await applyRules([diff], defaultRulesPath);
    const diffRule = diff.rule;
    expect(diffRule.name).to.equal("Rule to detect display name changes");
    expect(diffRule.type).to.equal("display-name-changed");
    expect(diffRule.params["category"]).to.equal("Breaking");
  });
});

describe("Operation removal", () => {
  it("applies operation removed rule ", async () => {
    const diff: NodeDiff = {
      id: "#/web-api/end-points/resource/get",
      type: ["apiContract:Operation"],
      added: {},
      removed: { "core:name": "oldName" }
    };
    await applyRules([diff], defaultRulesPath);
    const diffRule = diff.rule;
    expect(diffRule.name).to.equal("Rule to detect operation removal");
    expect(diffRule.type).to.equal("operation-removed");
    expect(diffRule.params["category"]).to.equal("Breaking");
  });
});

describe("Parameter removal", () => {
  it("applies parameter removed rule ", async () => {
    const diff: NodeDiff = {
      id: "#/web-api/end-points/resource/get",
      type: ["apiContract:Parameter"],
      added: {},
      removed: { "core:name": "oldName" }
    };
    await applyRules([diff], defaultRulesPath);
    const diffRule = diff.rule;
    expect(diffRule.name).to.equal("Rule to detect parameter removal");
    expect(diffRule.type).to.equal("parameter-removed");
    expect(diffRule.params["category"]).to.equal("Breaking");
  });
});

describe("Required parameter addition ", () => {
  it("applies required parameter added rule ", async () => {
    const diff: NodeDiff = {
      id: "#/web-api/end-points/resource/get",
      type: ["apiContract:Parameter"],
      added: { "core:name": "newName", "apiContract:required": true },
      removed: {}
    };
    await applyRules([diff], defaultRulesPath);
    const diffRule = diff.rule;
    expect(diffRule.name).to.equal(
      "Rule to detect required parameter addition"
    );
    expect(diffRule.type).to.equal("required-parameter-added");
    expect(diffRule.params["category"]).to.equal("Breaking");
  });
});

describe("Version change", () => {
  it("applies version change rule ", async () => {
    const diff: NodeDiff = {
      id: "#/web-api/end-points/resource/get",
      type: ["apiContract:WebAPI"],
      added: { "core:version": "v2" },
      removed: { "core:version": "v1" }
    };
    await applyRules([diff], defaultRulesPath);
    const diffRule = diff.rule;
    expect(diffRule.name).to.equal("Rule to detect version change");
    expect(diffRule.type).to.equal("version-changed");
    expect(diffRule.params["category"]).to.equal("Breaking");
  });
});
