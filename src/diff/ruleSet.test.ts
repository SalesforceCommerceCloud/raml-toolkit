/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import tmp from "tmp";
import fs from "fs-extra";
import { RuleSet } from "./ruleSet";
import { expect } from "@oclif/test";
import { Rule, TopLevelCondition } from "json-rules-engine";
import { DIFF_FACT_ID } from "./rulesProcessor";

/**
 * Build a default rule
 */
function buildDefaultRule(): Rule {
  return new Rule({
    name: "test rule to detect title changes",
    conditions: {
      all: [
        {
          fact: DIFF_FACT_ID,
          path: "$.type",
          operator: "contains",
          value: "apiContract:WebAPI"
        },
        {
          fact: DIFF_FACT_ID,
          path: "$.added",
          operator: "hasProperty",
          value: "core:name"
        },
        {
          fact: DIFF_FACT_ID,
          path: "$.removed",
          operator: "hasProperty",
          value: "core:name"
        }
      ]
    },
    event: {
      type: "api-title-change",
      params: {
        category: "Breaking",
        changedProperty: "core:name"
      }
    }
  });
}

describe("Create RuleSet instance", () => {
  const errMsg = "Error parsing the rules file";
  it("throws error when rules file path is undefined", async () => {
    expect(() => new RuleSet(undefined)).to.throw(errMsg);
  });

  it("throws error when the rules file path is null", async () => {
    expect(() => new RuleSet(null)).to.throw(errMsg);
  });

  it("throws error when the rules file path is empty", async () => {
    expect(() => new RuleSet("")).to.throw(errMsg);
  });

  it("throws error when the rules file does not exist", async () => {
    expect(() => new RuleSet("/tmp/no-rules.json")).to.throw(errMsg);
  });

  it("throws error when the rules file has no valid json", async () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    expect(() => new RuleSet(tmpFile.name)).to.throw(errMsg);
  });

  it("throws error when the rules are not defined as a json array", async () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    fs.writeJSONSync(tmpFile.name, {});
    expect(() => new RuleSet(tmpFile.name)).to.throw(
      "Rules must be defined as a json array"
    );
  });

  it("throws error when the rule has empty conditions", async () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    const ruleJson = buildDefaultRule().toJSON(false);
    ruleJson.conditions = {} as TopLevelCondition;
    fs.writeJSONSync(tmpFile.name, [ruleJson]);
    expect(() => new RuleSet(tmpFile.name)).to.throw("Error parsing the rule");
  });

  it("creates instance of RuleSet with a valid rules file", async () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    const rule = buildDefaultRule();
    fs.writeJSONSync(tmpFile.name, [rule.toJSON(false)]);
    const ruleSet = new RuleSet(tmpFile.name);
    //verify template and its content
    expect(ruleSet).to.be.an.instanceof(RuleSet);
    expect(ruleSet.rules).to.have.lengthOf(1);
    expect(ruleSet.rules[0].toJSON(false)).to.deep.equal(rule.toJSON(false));
  });
});

describe("Validate rule properties", () => {
  it("throws error when name is missing", async () => {
    const rule = buildDefaultRule();
    rule.name = undefined;
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    fs.writeJSONSync(tmpFile.name, [rule.toJSON()]);

    expect(() => new RuleSet(tmpFile.name)).to.throw(
      "Name is required for every rule"
    );
  });

  it("throws error when rule params are missing", async () => {
    const rule = buildDefaultRule();
    rule.event.params = undefined;
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    fs.writeJSONSync(tmpFile.name, [rule.toJSON(false)]);

    expect(() => new RuleSet(tmpFile.name)).to.throw(
      `Params are required in rule: ${rule.name}`
    );
  });

  it("throws error when category is missing", async () => {
    const rule = buildDefaultRule();
    rule.event.params.category = undefined;
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    fs.writeJSONSync(tmpFile.name, [rule.toJSON(false)]);

    expect(() => new RuleSet(tmpFile.name)).to.throw(
      `Category is required in rule: ${rule.name}`
    );
  });

  it("throws error when category is invalid", async () => {
    const rule = buildDefaultRule();
    rule.event.params.category = "Invalid";
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    fs.writeJSONSync(tmpFile.name, [rule.toJSON(false)]);

    expect(() => new RuleSet(tmpFile.name)).to.throw(
      `Invalid category in rule: ${rule.name}`
    );
  });

  it("throws error when changedProperty is not defined", async () => {
    const rule = buildDefaultRule();
    rule.event.params.changedProperty = undefined;
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    fs.writeJSONSync(tmpFile.name, [rule.toJSON(false)]);

    expect(() => new RuleSet(tmpFile.name)).to.throw(
      `Changed property is required in rule: ${rule.name}`
    );
  });

  it("throws error when changedProperty is null", async () => {
    const rule = buildDefaultRule();
    rule.event.params.changedProperty = null;
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    fs.writeJSONSync(tmpFile.name, [rule.toJSON(false)]);

    expect(() => new RuleSet(tmpFile.name)).to.throw(
      `Changed property is required in rule: ${rule.name}`
    );
  });

  it("throws error when changedProperty is empty", async () => {
    const rule = buildDefaultRule();
    rule.event.params.changedProperty = "";
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    fs.writeJSONSync(tmpFile.name, [rule.toJSON(false)]);

    expect(() => new RuleSet(tmpFile.name)).to.throw(
      `Changed property is required in rule: ${rule.name}`
    );
  });

  it("throws error when changedProperty is just a space", async () => {
    const rule = buildDefaultRule();
    rule.event.params.changedProperty = " ";
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    fs.writeJSONSync(tmpFile.name, [rule.toJSON(false)]);

    expect(() => new RuleSet(tmpFile.name)).to.throw(
      `Changed property is required in rule: ${rule.name}`
    );
  });
});

describe("Check for existence of rules", () => {
  it("returns 'false' when there are NO rules", async () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    fs.writeJSONSync(tmpFile.name, []);
    const ruleSet = new RuleSet(tmpFile.name);

    expect(ruleSet.hasRules()).to.be.false;
  });

  it("returns 'true' when there are rules", async () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    const rule = buildDefaultRule();
    fs.writeJSONSync(tmpFile.name, [rule.toJSON(false)]);
    const ruleSet = new RuleSet(tmpFile.name);

    expect(ruleSet.hasRules()).to.be.true;
  });
});
