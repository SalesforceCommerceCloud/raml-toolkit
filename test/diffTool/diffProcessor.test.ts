/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from "path";
import { diffRaml } from "../../src/diffTool/diffProcessor";
import { DIFF_FACT_ID } from "../../src/diffTool/rulesProcessor";
import { Rule } from "json-rules-engine";
import fs from "fs-extra";
import tmp from "tmp";
import { expect } from "chai";

describe("Test RAML differencing", () => {
  it("can generate differences between RAML files", async () => {
    const basePath = path.join(__dirname, "diffRaml");
    const leftRaml = path.join(basePath, "left.raml");
    const rightRaml = path.join(basePath, "right.raml");
    const diffs = await diffRaml(leftRaml, rightRaml);
    expect(diffs.length).to.greaterThan(0);
  });
  it("can generate differences and apply rules", async () => {
    const basePath = path.join(__dirname, "diffRaml");
    const leftRaml = path.join(basePath, "left.raml");
    const rightRaml = path.join(basePath, "right.raml");
    //create rules file
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const rule = buildRule();
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    fs.writeFileSync(tmpFile.name, `[${rule.toJSON()}]`);

    const diffs = await diffRaml(leftRaml, rightRaml, tmpFile.name);
    expect(diffs.length).to.greaterThan(0);
    const diffRule = diffs[0].rule;
    expect(diffRule.name).to.equal(rule.name);
    expect(diffRule.type).to.equal(rule.event.type);
    expect(diffRule.params).to.deep.equal(rule.event.params);
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
        category: "Breaking"
      }
    }
  });
}
