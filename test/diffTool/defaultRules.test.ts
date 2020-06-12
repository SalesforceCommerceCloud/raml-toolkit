/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { NodeDiff } from "../../src/diffTool/jsonDiff";
import { ApiChanges, applyRules } from "../../src/diffTool/rulesProcessor";
import * as path from "path";
import { expect } from "chai";

import { diffRulesPath } from "../../src/diffTool/diffProcessor";
import { Rule } from "json-rules-engine";
import fs from "fs-extra";

const defaultRulesPath = path.join(diffRulesPath, "defaultRules.json");
const defaultRules = fs.readJSONSync(defaultRulesPath);
/**
 * Verify that rule is applied on the diff
 * @param diff - Node difference
 * @param rule - Rule that is expected to be applied
 * @param apiChanges - Result after rule is applied
 */
function verifyRule(diff: NodeDiff, rule: Rule, apiChanges: ApiChanges): void {
  const nodeChanges = apiChanges.nodeChanges[0];
  expect(nodeChanges.nodeId).to.equal(diff.id);

  const categorizedChange = nodeChanges.changes[0];
  expect(categorizedChange.type).to.equal(rule.event.type);
  expect(categorizedChange.category).to.equal(rule.event.params.category);
}

describe("Display name change", () => {
  it("applies display name change rule", async () => {
    const diffs: NodeDiff[] = [
      {
        id: "#/web-api/end-points/resource/get",
        type: ["apiContract:Operation"],
        added: { "core:name": "newName" },
        removed: { "core:name": "oldName" }
      }
    ];
    const apiChanges = await applyRules(diffs, defaultRulesPath);

    const rule = defaultRules.find(
      r => r.event.type === "display-name-changed"
    );
    verifyRule(diffs[0], rule, apiChanges);
  });
});

describe("Operation removal", () => {
  it("applies operation removed rule", async () => {
    const diffs: NodeDiff[] = [
      {
        id: "#/web-api/end-points/resource/get",
        type: ["apiContract:Operation"],
        added: {},
        removed: { "core:name": "oldName" }
      }
    ];
    const apiChanges = await applyRules(diffs, defaultRulesPath);

    const rule = defaultRules.find(r => r.event.type === "operation-removed");
    verifyRule(diffs[0], rule, apiChanges);
  });
});

describe("Parameter removal", () => {
  it("applies parameter removed rule", async () => {
    const diffs: NodeDiff[] = [
      {
        id: "#/web-api/end-points/resource/get",
        type: ["apiContract:Parameter"],
        added: {},
        removed: { "core:name": "oldName" }
      }
    ];
    const apiChanges = await applyRules(diffs, defaultRulesPath);

    const rule = defaultRules.find(r => r.event.type === "parameter-removed");
    verifyRule(diffs[0], rule, apiChanges);
  });
});

describe("Required parameter addition", () => {
  it("applies required parameter added rule", async () => {
    const diffs: NodeDiff[] = [
      {
        id: "#/web-api/end-points/resource/get",
        type: ["apiContract:Parameter"],
        added: { "core:name": "newName", "apiContract:required": true },
        removed: {}
      }
    ];
    const apiChanges = await applyRules(diffs, defaultRulesPath);

    const rule = defaultRules.find(
      r => r.event.type === "required-parameter-added"
    );
    verifyRule(diffs[0], rule, apiChanges);
  });
});

describe("Version change", () => {
  it("applies version change rule", async () => {
    const diffs: NodeDiff[] = [
      {
        id: "#/web-api/end-points/resource/get",
        type: ["apiContract:WebAPI"],
        added: { "core:version": "v2" },
        removed: { "core:version": "v1" }
      }
    ];
    const apiChanges = await applyRules(diffs, defaultRulesPath);

    const rule = defaultRules.find(r => r.event.type === "version-changed");
    verifyRule(diffs[0], rule, apiChanges);
  });
});
