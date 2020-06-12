/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { NodeDiff } from "../../src/diffTool/jsonDiff";
import {
  ApiChanges,
  applyRules,
  DIFF_FACT_ID
} from "../../src/diffTool/rulesProcessor";
import tmp from "tmp";
import fs from "fs-extra";
import { Rule, TopLevelCondition } from "json-rules-engine";
import { expect } from "chai";

/**
 * Get a basic difference object
 */
function getDefaultDiff(): NodeDiff {
  return {
    id: "#/web-api/end-points/resource/get",
    type: ["apiContract:Operation"],
    added: { "core:name": "newName" },
    removed: { "core:name": "oldName" }
  };
}

/**
 * Build rule with the given conditions
 * @param conditions - Conditions in the rule
 */
function buildRule(conditions: TopLevelCondition): Rule {
  return new Rule({
    name: "Test",
    conditions: conditions,
    event: {
      type: "test-rule",
      params: {
        category: "Breaking"
      }
    }
  });
}

/**
 * Create temporary rules file
 * @param rule - Rule in the rules file
 */
function createRulesFile(rule: Rule): string {
  const tmpFile = tmp.fileSync({ postfix: ".json" });
  fs.writeFileSync(tmpFile.name, `[${rule.toJSON()}]`);
  return tmpFile.name;
}

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

describe("Custom operators - hasProperty ", () => {
  it("applies rule when the diff object contains given key", async () => {
    const diffs: NodeDiff[] = [getDefaultDiff()];
    const rule = buildRule({
      all: [
        {
          fact: DIFF_FACT_ID,
          path: "$.added",
          operator: "hasProperty",
          value: "core:name"
        }
      ]
    });

    const apiChanges = await applyRules(diffs, createRulesFile(rule));
    verifyRule(diffs[0], rule, apiChanges);
  });

  it("does NOT apply rule when the diff object does not contain given key", async () => {
    const diffs: NodeDiff[] = [getDefaultDiff()];
    const rule = buildRule({
      all: [
        {
          fact: DIFF_FACT_ID,
          path: "$.added",
          operator: "hasProperty",
          value: "core:desc"
        }
      ]
    });

    const apiChanges = await applyRules(diffs, createRulesFile(rule));

    expect(apiChanges.nodeChanges.length).to.equal(0);
    expect(apiChanges.ignoredChanges).to.equal(0);
  });
});

describe("Custom operators - hasNoProperty ", () => {
  it("rule is applied when the diff object does not contain given key", async () => {
    const diffs: NodeDiff[] = [getDefaultDiff()];
    const rule = buildRule({
      all: [
        {
          fact: DIFF_FACT_ID,
          path: "$.added",
          operator: "hasNoProperty",
          value: "core:desc"
        }
      ]
    });

    const apiChanges = await applyRules(diffs, createRulesFile(rule));
    verifyRule(diffs[0], rule, apiChanges);
  });
  it("rule is NOT applied when the diff object contains given key", async () => {
    const diffs: NodeDiff[] = [getDefaultDiff()];
    const rule = buildRule({
      all: [
        {
          fact: DIFF_FACT_ID,
          path: "$.added",
          operator: "hasNoProperty",
          value: "core:name"
        }
      ]
    });

    const apiChanges = await applyRules(diffs, createRulesFile(rule));
    expect(apiChanges.nodeChanges.length).to.equal(0);
    expect(apiChanges.ignoredChanges).to.equal(0);
  });
});
