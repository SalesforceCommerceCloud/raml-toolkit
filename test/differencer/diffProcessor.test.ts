/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from "path";
import { diffRaml } from "../../src/differencer/diffProcessor";
import * as chai from "chai";

const expect = chai.expect;
const assert = chai.assert;

describe("Test RAML differencing", () => {
  it("can generate differences between RAML files ", async () => {
    const basePath = path.join(__dirname, "diffRaml");
    const leftRaml = path.join(basePath, "left.raml");
    const rightRaml = path.join(basePath, "right.raml");
    const diffs = await diffRaml(leftRaml, rightRaml);
    assert(diffs != null);
    expect(diffs.length).to.greaterThan(0);
  });
});
