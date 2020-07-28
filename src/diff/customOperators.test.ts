/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { NodeDiff } from "./jsonDiff";
import { applyRules, DIFF_FACT_ID } from "./rulesProcessor";
import tmp from "tmp";
import fs from "fs-extra";
import { Rule, TopLevelCondition } from "json-rules-engine";
import { expect } from "chai";
import { RuleCategory } from "./ruleSet";

/* eslint-disable @typescript-eslint/no-use-before-define */

describe("Custom operators - hasProperty", () => {
  it("applies rule when the diff object contains given key", async () => {
    let diffs: NodeDiff[] = [getDefaultDiff()];
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

    diffs = await applyRules(diffs, createRulesFile(rule));

    const diffRule = diffs[0].rule;
    expect(diffRule.name).to.equal(rule.name);
    expect(diffRule.type).to.equal(rule.event.type);
    expect(diffRule.params).to.deep.equal(rule.event.params);
  });

  it("does NOT apply rule when the diff object does not contain given key", async () => {
    let diffs: NodeDiff[] = [getDefaultDiff()];
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

    diffs = await applyRules(diffs, createRulesFile(rule));

    expect(diffs[0].rule).to.be.undefined;
  });
});

describe("Custom operators - hasNoProperty", () => {
  it("rule is applied when the diff object does not contain given key", async () => {
    let diffs: NodeDiff[] = [getDefaultDiff()];
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

    diffs = await applyRules(diffs, createRulesFile(rule));

    const diffRule = diffs[0].rule;
    expect(diffRule.name).to.equal(rule.name);
    expect(diffRule.type).to.equal(rule.event.type);
    expect(diffRule.params).to.deep.equal(rule.event.params);
  });
  it("rule is NOT applied when the diff object contains given key", async () => {
    let diffs: NodeDiff[] = [getDefaultDiff()];
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

    diffs = await applyRules(diffs, createRulesFile(rule));

    expect(diffs[0].rule).to.be.undefined;
  });
});

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
        category: RuleCategory.BREAKING,
        changedProperty: "core:name"
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
