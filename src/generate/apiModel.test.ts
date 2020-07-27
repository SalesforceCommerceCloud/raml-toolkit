/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";

import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";

import { ApiModel } from "./apiModel";
// import { model } from "amf-client-js";
import { Name } from "../common/structures/name";
import tmp from "tmp";

const validRamlFile = path.join(
  __dirname,
  "../../testResources/raml/site/site.raml"
);

const invalidRamlFile = path.join(
  __dirname,
  "../../testResources/raml/invalid/search-invalid.raml"
);

before(() => {
  chai.use(chaiAsPromised);
});

describe("ApiModel tests", () => {
  it("constructs successfully with directory", () => {
    const api = new ApiModel(path.dirname(validRamlFile));
    expect(api.dataTypes).to.be.empty;
    expect(api.model).to.be.undefined;
    expect(api.name).to.deep.equal(new Name("site"));
  });

  it("constructs successfully with raml file", () => {
    const api = new ApiModel(validRamlFile);
    expect(api.dataTypes).to.be.empty;
    expect(api.model).to.be.undefined;
    expect(api.name).to.deep.equal(new Name("site.raml"));
  });

  it("constructs unsuccessfully because empty content", () => {
    const tmpDir = tmp.dirSync();

    expect(() => new ApiModel(tmpDir.name)).to.throw(
      "No exchange.json or no raml file provided, can't load api"
    );
  });

  it("constructs unsuccessfully because of bad path", () => {
    expect(() => new ApiModel("NOT_A_DIRECTORY")).to.throw(
      "ENOENT: no such file or directory, lstat 'NOT_A_DIRECTORY'"
    );
  });

  it("constructs successfully even with an invalid raml file", () => {
    const api = new ApiModel(path.dirname(invalidRamlFile));
    expect(api.dataTypes).to.be.empty;
    expect(api.model).to.be.undefined;
    expect(api.name).to.deep.equal(new Name("invalid"));
  });

  it("initializes the model successfully", async () => {
    const api = new ApiModel(path.dirname(validRamlFile));
    await api.init();
    expect(api.dataTypes).to.not.be.empty;
    expect(api.model).to.not.be.empty;
    expect(api.name).to.deep.equal(new Name("Shop API"));
  });

  it("initializes the model successfully without updating the name", async () => {
    const api = new ApiModel(path.dirname(validRamlFile));
    await api.init(false);
    expect(api.dataTypes).to.not.be.empty;
    expect(api.model).to.not.be.empty;
    expect(api.name).to.deep.equal(new Name("site"));
  });

  it("throws when initializing with an invalid raml file", async () => {
    const api = new ApiModel(path.dirname(invalidRamlFile));
    return expect(api.init()).to.eventually.be.rejected;
  });

  it("throws when updating the name without a model ", () => {
    const api = new ApiModel(path.dirname(invalidRamlFile));
    expect(() => api.updateName()).to.throw(
      "Cannot update the name before the model is loaded"
    );
  });
});
