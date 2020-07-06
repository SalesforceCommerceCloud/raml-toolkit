/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";

import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";

import Api from "./api";
import { model } from "amf-client-js";

const validRamlFile = path.join(__dirname, "../../test/site.raml");
const invalidRamlFile = path.join(__dirname, "../../test/search-invalid.raml");

before(() => {
  chai.use(chaiAsPromised);
});

describe("Test Api class read", () => {
  it("constructs an instance with no args", () => {
    const api = new Api();
    expect(api.dataTypes).to.be.empty;
    expect(api.model).to.eql(new model.document.Document());
    expect(api.name.original).to.be.empty;
    expect(api.path).to.be.empty;
  });
});

describe("Test Api class read", () => {
  it("creates an instance from a valid raml file", async () => {
    const api = await Api.read(validRamlFile);
    expect(api.dataTypes).to.not.be.empty;
    expect(api.model).to.not.be.empty;
    expect(api.name.original).to.equal("Shop API");
    expect(api.name.lowerCamelCase).to.equal("shopApi");
    expect(api.path).to.be.equal(validRamlFile);
  });

  it("rejects from an invalid raml file", () => {
    return expect(Api.read(invalidRamlFile)).to.eventually.be.rejected;
  });

  it("rejects from an invalid file path", () => {
    return expect(Api.read("THISISNOTAREALFILE")).to.eventually.be.rejected;
  });
});
