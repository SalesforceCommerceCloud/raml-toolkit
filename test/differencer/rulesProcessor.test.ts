/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { NodeDiff } from "../../src/diffTool/jsonDiff";
import { applyRules } from "../../src/diffTool/rulesProcessor";
import * as chai from "chai";
import path from "path";
import fs from "fs-extra";
import tmp from "tmp";
import sinon from "sinon";
import { ramlToolLogger } from "../../src";
import chaiAsPromised from "chai-as-promised";

/* eslint-disable @typescript-eslint/no-use-before-define*/

const expect = chai.expect;
const rulesPath = path.join(__dirname, "..", "..", "diffRules", "rules.json");
let loggerSpy;
before(() => {
  chai.should();
  chai.use(chaiAsPromised);
  loggerSpy = sinon.spy(ramlToolLogger, "info");
});
after(() => {
  sinon.reset();
});

describe("Test that rules application exits with relevant message when there are no differences", () => {
  const noDiffsMsg = "No differences to apply the rules";
  it("exits when the differences are undefined", async () => {
    const diffs = undefined;
    await applyRules(undefined, rulesPath);
    expect(diffs).to.equal(diffs);
    sinon.assert.calledWith(loggerSpy, noDiffsMsg);
  });
  it("exits when there are empty differences", async () => {
    const diffs = [];
    await applyRules(diffs, rulesPath);
    expect(diffs).to.deep.equal(diffs);
    sinon.assert.calledWith(loggerSpy, noDiffsMsg);
  });
  it("exits when the differences are null", async () => {
    const diffs = null;
    await applyRules(null, rulesPath);
    expect(diffs).to.equal(diffs);
    sinon.assert.calledWith(loggerSpy, noDiffsMsg);
  });
});

describe("Test that rules application exits with relevant message when there are no rules", () => {
  it("throws error when rules file path is undefined", async () => {
    const diffs = [new NodeDiff("test")];
    const rulesPath = undefined;
    return expect(applyRules(diffs, rulesPath)).to.eventually.be.rejectedWith(
      `Invalid rules path: ${rulesPath}`
    );
  });
  it("throws error when the rules file path is null", async () => {
    const diffs = [new NodeDiff("test")];
    const rulesPath = null;
    return expect(applyRules(diffs, rulesPath)).to.eventually.be.rejectedWith(
      `Invalid rules path: ${rulesPath}`
    );
  });
  it("throws error when the rules file path is empty", async () => {
    const diffs = [new NodeDiff("test")];
    const rulesPath = "";
    return expect(applyRules(diffs, rulesPath)).to.eventually.be.rejectedWith(
      `Invalid rules path: ${rulesPath}`
    );
  });
  it("throws error when the rules file do not exist", async () => {
    const diffs = [new NodeDiff("test")];
    const rulesPath = "/tmp/no-rules.json";
    return expect(applyRules(diffs, rulesPath)).to.eventually.be.rejectedWith(
      `Error parsing the rules file: ${rulesPath}`
    );
  });
  it("throws error when the rules file has no valid json", async () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    const diffs = [new NodeDiff("test")];
    return expect(
      applyRules(diffs, tmpFile.name)
    ).to.eventually.be.rejectedWith(
      `Error parsing the rules file '${tmpFile.name}'`
    );
  });
  it("throws error when the rules is not a json array", async () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    const rules = {};
    fs.writeFileSync(tmpFile.name, JSON.stringify(rules));
    const diffs = [new NodeDiff("test")];
    return expect(
      applyRules(diffs, tmpFile.name)
    ).to.eventually.be.rejectedWith(
      `Rules must be defined as a json array: ${JSON.stringify(rules, null, 2)}`
    );
  });
  it("exits when rules is an empty array", async () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    fs.writeFileSync(tmpFile.name, "[]");
    const diffs = [new NodeDiff("test")];
    await applyRules(diffs, tmpFile.name);
    //verify that diff is not modified
    expect(diffs).to.deep.equal(diffs);
    //verify log message
    sinon.assert.calledWith(loggerSpy, "No rules to apply on the differences");
  });
});

describe("Test display name change rule ", () => {
  const rulesPath = path.join(__dirname, "..", "..", "diffRules", "rules.json");
  it("applies display name change rule ", async () => {
    const diff: NodeDiff = {
      id: "#/web-api/end-points/resource/get",
      type: ["apiContract:Operation"],
      added: { "core:name": "newName" },
      removed: { "core:name": "oldName" }
    };
    await applyRules([diff], rulesPath);
    const diffRule = diff.rule;
    expect(diffRule.name).to.equal("Rule to detect display name changes");
    expect(diffRule.type).to.equal("display-name-change");
    expect(diffRule.params["category"]).to.equal("Breaking");
  });
});
