/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";

import { ApiMetadata } from "./apiMetadata";

import { Name } from "./name";

before(() => {
  chai.use(chaiAsPromised);
});

describe("Test ApiGroup class init", () => {
  it("creates an instance from a valid raml file (no children)", async () => {
    const metadata = new ApiMetadata("apis/something");
    expect(metadata.metadata).to.be.undefined;
    expect(metadata.children).to.be.empty;
    expect(metadata.name).to.be.deep.equal(new Name("something"));
  });

  it("creates an instance from a valid raml file (with child)", async () => {
    const child = new ApiMetadata("apis/child");
    const metadata = new ApiMetadata("apis/something", [child]);
    expect(metadata.metadata).to.be.undefined;
    expect(metadata.children).to.have.length(1);
    expect(metadata.children).to.be.deep.equal([child]);
    expect(metadata.name).to.be.deep.equal(new Name("something"));
  });
});
