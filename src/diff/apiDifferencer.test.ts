/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from "path";
import { ApiDifferencer } from "./apiDifferencer";
import { DIFF_FACT_ID } from "./rulesProcessor";
import { Rule } from "json-rules-engine";
import fs from "fs-extra";
import tmp from "tmp";
import { expect } from "chai";
import { RuleCategory } from "./ruleCategory";

const basePath = path.join(__dirname, "../../testResources/diff");

describe("Test RAML differencing", () => {
  it("can generate differences between RAML files", async () => {
    const baseRaml = path.join(basePath, "left.raml");
    const newRaml = path.join(basePath, "right.raml");
    const apiDifferencer = new ApiDifferencer(baseRaml, newRaml);
    const apiChanges = await apiDifferencer.findChanges();
    expect(apiChanges.hasChanges()).to.be.true;
  });
  it("can generate differences and apply rules", async () => {
    const baseRaml = path.join(basePath, "left.raml");
    const newRaml = path.join(basePath, "right.raml");
    //create rules file

    const rule = buildRule();
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    fs.writeFileSync(tmpFile.name, `[${rule.toJSON()}]`);

    const apiDifferencer = new ApiDifferencer(baseRaml, newRaml);
    const apiChanges = await apiDifferencer.findAndCategorizeChanges(
      tmpFile.name
    );
    const categorizedChanges = apiChanges.nodeChanges.find(
      (nodeChanges) => nodeChanges.id === "#/web-api"
    ).categorizedChanges;

    expect(apiChanges.hasChanges()).to.be.true;
    expect(categorizedChanges).to.have.length(1);
    expect(categorizedChanges[0].ruleEvent).to.equal(rule.event.type);
    expect(categorizedChanges[0].category).to.deep.equal(
      rule.event.params.category
    );
  });
  it("can generate differences and apply default rules", async () => {
    const baseRaml = path.join(basePath, "left.raml");
    const newRaml = path.join(basePath, "right.raml");

    const apiDifferencer = new ApiDifferencer(baseRaml, newRaml);
    const apiChanges = await apiDifferencer.findAndCategorizeChanges();
    expect(apiChanges.hasChanges()).to.equal(true);
    const categorizedChanges = apiChanges.nodeChanges.find(
      (nodeChanges) => nodeChanges.id === "#/web-api"
    ).categorizedChanges;

    expect(categorizedChanges).to.have.length(1);
    expect(categorizedChanges[0].ruleEvent).to.equal("version-changed");
  });
});

/**
 * Builds rule to detect title changes in test RAML
 */
function buildRule(): Rule {
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
        category: RuleCategory.BREAKING,
        changedProperty: "core:name",
      },
    },
  });
}
