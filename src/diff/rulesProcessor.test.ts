/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { NodeChanges } from "./changes/nodeChanges";
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

describe("Rules engine when rules file has no rules", () => {
  it("returns when rules is an empty array", async () => {
    const tmpFile = tmp.fileSync({ postfix: ".json" });
    fs.writeFileSync(tmpFile.name, "[]");
    let diffs = [new NodeChanges("test", ["test:type"])];
    diffs = await applyRules(diffs, tmpFile.name);
    //verify that diff is not modified
    expect(diffs).to.deep.equal(diffs);
  });
});
