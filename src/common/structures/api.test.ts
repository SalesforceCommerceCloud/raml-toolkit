/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";

import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";

import { Api, createApi } from "./api";
import { model } from "amf-client-js";

const validRamlFile = path.join(
  __dirname,
  "../../../testResources/raml/site/site.raml"
);
const invalidRamlFile = path.join(
  __dirname,
  "../../../testResources/raml/invalid/search-invalid.raml"
);

before(() => {
  chai.use(chaiAsPromised);
});

describe("Test Api class init", () => {
  it("constructs an instance with model and no path", () => {
    const api = new Api(new model.document.Document(), "apis/test");
    expect(api.dataTypes).to.be.empty;
    expect(api.model).to.deep.equal(new model.document.Document());
    expect(api.name.original).to.be.empty;
  });
});

describe("Test Api class init", () => {
  it("creates an instance from a valid raml file", async () => {
    const api = await createApi(validRamlFile);
    expect(api.dataTypes).to.not.be.empty;
    expect(api.model).to.not.be.empty;
    expect(api.name.original).to.equal("Shop API");
    expect(api.name.lowerCamelCase).to.equal("shopApi");
  });

  it("rejects from an invalid raml file", () => {
    return expect(createApi(invalidRamlFile)).to.eventually.be.rejected;
  });

  it("rejects from an invalid file path", () => {
    return expect(createApi("THISISNOTAREALFILE")).to.eventually.be.rejected;
  });
});
