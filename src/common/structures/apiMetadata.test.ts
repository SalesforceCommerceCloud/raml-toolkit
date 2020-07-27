/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";

import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";

import { ApiMetadata } from "./apiMetadata";

import { Name } from "./name";

before(() => {
  chai.use(chaiAsPromised);
});

describe("Test ApiGroup class init", () => {
  it("creates an instance from a valid raml file", async () => {
    const metadata = new ApiMetadata("apis/something");

    expect(metadata.metadata).to.be.undefined;
    expect(metadata.name).to.be.deep.equal(new Name("something"));
  });
});
