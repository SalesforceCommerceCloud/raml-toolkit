/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { NodeDiff } from "./jsonDiff";
import { applyRules } from "./rulesProcessor";
import * as chai from "chai";
import fs from "fs-extra";
import tmp from "tmp";
import chaiAsPromised from "chai-as-promised";

const expect = chai.expect;
chai.use(chaiAsPromised);

describe("Rules engine when no differences are provided", () => {
  it("returns undefined when the differences are undefined", async () => {
    return expect(applyRules(undefined, "test.json")).to.eventually.be
      .undefined;
  });
  it("returns empty when there are empty differences", async () => {
    let diffs = [];
    diffs = await applyRules(diffs, "test.json");
    expect(diffs).to.deep.equal([]);
  });
  it("returns null when the differences are null", async () => {
    return expect(applyRules(null, "test.json")).to.eventually.be.null;
  });
});

describe("Rules engine when rules file is invalid", () => {
  const errMsg = "Error parsing the rules file";
  it("throws error when rules file path is undefined", async () => {
    const diffs = [new NodeDiff("test")];
    const rulesPath = undefined;
    return expect(applyRules(diffs, rulesPath)).to.eventually.be.rejectedWith(
      errMsg
    );
  });
  it("throws error when the rules file path is null", async () => {
    const diffs = [new NodeDiff("test")];
    const rulesPath = null;
    return expect(applyRules(diffs, rulesPath)).to.eventually.be.rejectedWith(
      errMsg
    );
  });
  it("throws error when the rules file path is empty", async () => {
    const diffs = [new NodeDiff("test")];
    const rulesPath = "";
    return expect(applyRules(diffs, rulesPath)).to.eventually.be.rejectedWith(
      errMsg
    );
  });
  it("throws error when the rules file do not exist", async () => {
    const diffs = [new NodeDiff("test")];
    const rulesPath = "/tmp/no-rules.json";
    return expect(applyRules(diffs, rulesPath)).to.eventually.be.rejectedWith(
      errMsg
    );
  });
  it("throws error when the rules file has no valid json", async () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    const diffs = [new NodeDiff("test")];
    return expect(
      applyRules(diffs, tmpFile.name)
    ).to.eventually.be.rejectedWith(errMsg);
  });
  it("throws error when the rules is not a json array", async () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    const rules = {};
    fs.writeFileSync(tmpFile.name, JSON.stringify(rules));
    const diffs = [new NodeDiff("test")];
    return expect(
      applyRules(diffs, tmpFile.name)
    ).to.eventually.be.rejectedWith("Rules must be defined as a json array");
  });
  it("returns when rules is an empty array", async () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    fs.writeFileSync(tmpFile.name, "[]");
    let diffs = [new NodeDiff("test")];
    diffs = await applyRules(diffs, tmpFile.name);
    //verify that diff is not modified
    expect(diffs).to.deep.equal(diffs);
  });
});
