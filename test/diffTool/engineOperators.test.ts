/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { NodeDiff } from "../../src/diffTool/jsonDiff";
import { applyRules, DIFF_FACT_ID } from "../../src/diffTool/rulesProcessor";
import tmp from "tmp";
import fs from "fs-extra";
import { Rule, TopLevelCondition } from "json-rules-engine";
import * as chai from "chai";
/* eslint-disable @typescript-eslint/no-use-before-define */

const expect = chai.expect;

describe("Custom operators - hasProperty ", () => {
  it("rule is applied when the diff object contains given key", async () => {
    const diff = getDefaultDiff();
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

    await applyRules([diff], createRulesFile(rule));

    const diffRule = diff.rule;
    expect(diffRule.name).to.equal(rule.name);
    expect(diffRule.type).to.equal(rule.event.type);
    expect(diffRule.params).to.deep.equal(rule.event.params);
  });

  it("rule is NOT applied when the diff object does not contain given key", async () => {
    const diff = getDefaultDiff();
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

    await applyRules([diff], createRulesFile(rule));

    expect(diff.rule).to.undefined;
  });
});

describe("Custom operators - hasNoProperty ", () => {
  it("rule is applied when the diff object does not contain given key", async () => {
    const diff = getDefaultDiff();
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

    await applyRules([diff], createRulesFile(rule));

    const diffRule = diff.rule;
    expect(diffRule.name).to.equal(rule.name);
    expect(diffRule.type).to.equal(rule.event.type);
    expect(diffRule.params).to.deep.equal(rule.event.params);
  });
  it("rule is NOT applied when the diff object contains given key", async () => {
    const diff = getDefaultDiff();
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

    await applyRules([diff], createRulesFile(rule));

    expect(diff.rule).to.undefined;
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
