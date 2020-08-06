/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import tmp from "tmp";
import fs from "fs-extra";
import { RuleSet } from "./ruleSet";
import { Rule, TopLevelCondition } from "json-rules-engine";
import { DIFF_FACT_ID } from "./rulesProcessor";

const expect = chai.expect;
chai.use(chaiAsPromised);

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
          value: "apiContract:WebAPI",
        },
        {
          fact: DIFF_FACT_ID,
          path: "$.added",
          operator: "hasProperty",
          value: "core:name",
        },
        {
          fact: DIFF_FACT_ID,
          path: "$.removed",
          operator: "hasProperty",
          value: "core:name",
        },
      ],
    },
    event: {
      type: "api-title-change",
      params: {
        category: "Breaking",
        changedProperty: "core:name",
      },
    },
  });
}

describe("Create RuleSet instance from rules file", () => {
  const errMsg = "Error parsing the rules file";
  it("throws error when rules file path is undefined", () => {
    return expect(RuleSet.init(undefined)).to.eventually.be.rejectedWith(
      errMsg
    );
  });

  it("throws error when the rules file path is null", () => {
    return expect(RuleSet.init(null)).to.eventually.be.rejectedWith(errMsg);
  });

  it("throws error when the rules file path is empty", () => {
    return expect(RuleSet.init("")).to.eventually.be.rejectedWith(errMsg);
  });

  it("throws error when the rules file does not exist", () => {
    return expect(
      RuleSet.init("/tmp/no-rules.json")
    ).to.eventually.be.rejectedWith(errMsg);
  });

  it("throws error when the rules file has no valid json", () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    return expect(RuleSet.init(tmpFile.name)).to.eventually.be.rejectedWith(
      errMsg
    );
  });

  it("throws error when the rules are not defined as a json array", () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    fs.writeJSONSync(tmpFile.name, {});
    return expect(RuleSet.init(tmpFile.name)).to.eventually.be.rejectedWith(
      "Rules must be defined as a json array"
    );
  });

  it("throws error when the rule has empty conditions", () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    const ruleJson = buildDefaultRule().toJSON(false);
    ruleJson.conditions = {} as TopLevelCondition;
    fs.writeJSONSync(tmpFile.name, [ruleJson]);
    return expect(RuleSet.init(tmpFile.name)).to.eventually.be.rejectedWith(
      "Error parsing the rule"
    );
  });

  it("creates instance of RuleSet with a valid rules file", async () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    const rule = buildDefaultRule();
    fs.writeJSONSync(tmpFile.name, [rule.toJSON(false)]);
    const ruleSet = await RuleSet.init(tmpFile.name);
    //verify template and its content
    expect(ruleSet).to.be.an.instanceof(RuleSet);
    expect(ruleSet.rules).to.have.lengthOf(1);
    expect(ruleSet.rules[0].toJSON(false)).to.deep.equal(rule.toJSON(false));
  });
});

describe("Create RuleSet instance from rules", () => {
  it("creates RuleSet object", async () => {
    const rules = [buildDefaultRule()];
    const ruleSet = new RuleSet(rules);
    expect(ruleSet).to.be.an.instanceof(RuleSet);
    expect(ruleSet.rules).to.deep.equal(rules);
  });
});

describe("Validate rule properties", () => {
  it("throws error when name is missing", async () => {
    const rule = buildDefaultRule();
    rule.name = undefined;

    expect(() => new RuleSet([rule])).to.throw(
      "Name is required for every rule"
    );
  });

  it("throws error when rule params are missing", async () => {
    const rule = buildDefaultRule();
    rule.event.params = undefined;

    expect(() => new RuleSet([rule])).to.throw(
      `Params are required in rule: ${rule.name}`
    );
  });

  it("throws error when category is missing", async () => {
    const rule = buildDefaultRule();
    rule.event.params.category = undefined;

    expect(() => new RuleSet([rule])).to.throw(
      `Category is required in rule: ${rule.name}`
    );
  });

  it("throws error when category is invalid", async () => {
    const rule = buildDefaultRule();
    rule.event.params.category = "Invalid";

    expect(() => new RuleSet([rule])).to.throw(
      `Invalid category in rule: ${rule.name}`
    );
  });

  it("throws error when changedProperty is not defined", async () => {
    const rule = buildDefaultRule();
    rule.event.params.changedProperty = undefined;

    expect(() => new RuleSet([rule])).to.throw(
      `Changed property is required in rule: ${rule.name}`
    );
  });

  it("throws error when changedProperty is null", async () => {
    const rule = buildDefaultRule();
    rule.event.params.changedProperty = null;

    expect(() => new RuleSet([rule])).to.throw(
      `Changed property is required in rule: ${rule.name}`
    );
  });

  it("throws error when changedProperty is empty", async () => {
    const rule = buildDefaultRule();
    rule.event.params.changedProperty = "";

    expect(() => new RuleSet([rule])).to.throw(
      `Changed property is required in rule: ${rule.name}`
    );
  });

  it("throws error when changedProperty is just a space", async () => {
    const rule = buildDefaultRule();
    rule.event.params.changedProperty = " ";

    expect(() => new RuleSet([rule])).to.throw(
      `Changed property is required in rule: ${rule.name}`
    );
  });
});

describe("Check for existence of rules", () => {
  it("returns 'false' when there are NO rules", async () => {
    const ruleSet = new RuleSet([]);
    expect(ruleSet.hasRules()).to.be.false;
  });

  it("returns 'true' when there are rules", async () => {
    const ruleSet = new RuleSet([buildDefaultRule()]);
    expect(ruleSet.hasRules()).to.be.true;
  });
});
