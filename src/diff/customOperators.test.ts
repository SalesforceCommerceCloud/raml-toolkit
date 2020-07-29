/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { NodeChanges } from "./changes/nodeChanges";
import { applyRules, DIFF_FACT_ID } from "./rulesProcessor";
import tmp from "tmp";
import fs from "fs-extra";
import { Rule, TopLevelCondition } from "json-rules-engine";
import { expect } from "chai";
import { RuleCategory } from "./ruleSet";

/* eslint-disable @typescript-eslint/no-use-before-define */
/**
 * Verify that rule is applied on node changes
 * @param nodeChanges - Node changes
 * @param rule - Rule that is expected to be applied
 */
function verifyRule(nodeChanges: NodeChanges, rule: Rule): void {
  const categorizedChanges = nodeChanges.categorizedChanges;
  let changedValues: [unknown, unknown];
  if (rule.event.params.changedProperty) {
    changedValues = [
      nodeChanges.removed[rule.event.params.changedProperty],
      nodeChanges.added[rule.event.params.changedProperty]
    ];
  }
  expect(categorizedChanges).to.have.length(1);
  expect(categorizedChanges[0].ruleName).to.equal(rule.name);
  expect(categorizedChanges[0].ruleEvent).to.equal(rule.event.type);
  expect(categorizedChanges[0].category).to.equal(rule.event.params.category);
  expect(categorizedChanges[0].change).to.deep.equal(changedValues);
}

describe("Custom operators - hasProperty", () => {
  it("applies rule when the diff object contains given key", async () => {
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

    const nodeChanges = await applyRules(
      [getDefaultNodeChanges()],
      createRulesFile(rule)
    );
    verifyRule(nodeChanges[0], rule);
  });

  it("does NOT apply rule when the diff object does not contain given key", async () => {
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

    const nodeChanges = await applyRules(
      [getDefaultNodeChanges()],
      createRulesFile(rule)
    );
    expect(nodeChanges[0].categorizedChanges).to.have.length(0);
  });
});

describe("Custom operators - hasNoProperty", () => {
  it("rule is applied when the diff object does not contain given key", async () => {
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

    const nodeChanges = await applyRules(
      [getDefaultNodeChanges()],
      createRulesFile(rule)
    );
    verifyRule(nodeChanges[0], rule);
  });
  it("rule is NOT applied when the diff object contains given key", async () => {
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

    const nodeChanges = await applyRules(
      [getDefaultNodeChanges()],
      createRulesFile(rule)
    );
    expect(nodeChanges[0].categorizedChanges).to.have.length(0);
  });
});

/**
 * Get a basic node changes object
 */
function getDefaultNodeChanges(): NodeChanges {
  const nodeChanges = new NodeChanges("#/web-api/end-points/resource/get", [
    "apiContract:Operation"
  ]);
  nodeChanges.added = { "core:name": "newName" };
  nodeChanges.removed = { "core:name": "oldName" };
  return nodeChanges;
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
