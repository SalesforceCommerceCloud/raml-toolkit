/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";

import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";
import { model } from "amf-client-js";

import { ApiGroup } from "./apiGroup";
import { Api } from "./api";

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

describe("Test ApiGroup class init", () => {
  it("creates an instance from a valid raml file", async () => {
    const group = await ApiGroup.init([validRamlFile]);
    expect(group).to.not.be.empty;
    expect(group[0].model).to.not.be.empty;
    expect(group[0].name.original).to.equal("Shop API");
    expect(group[0].path).to.equal(validRamlFile);
  });

  it("creates an instance from two valid raml files", async () => {
    const group = await ApiGroup.init([validRamlFile, validRamlFile]);
    expect(group).to.not.be.empty;
    expect(group[0].model).to.not.be.empty;
    expect(group[0].name.original).to.equal("Shop API");
    expect(group[0].path).to.equal(validRamlFile);
    expect(group[1].model).to.not.be.empty;
    expect(group[1].name.original).to.equal("Shop API");
    expect(group[1].path).to.equal(validRamlFile);
  });

  it("rejects from an invalid raml file", () => {
    return expect(ApiGroup.init([invalidRamlFile])).to.eventually.be.rejected;
  });

  it("rejects from one good, one bad raml file", () => {
    return expect(ApiGroup.init([validRamlFile, invalidRamlFile])).to.eventually
      .be.rejected;
  });

  it("rejects from an invalid file path", () => {
    return expect(ApiGroup.init(["THISISNOTAREALFILE"])).to.eventually.be
      .rejected;
  });

  it("rejects from an invalid file path plus a good one", () => {
    return expect(ApiGroup.init([validRamlFile, "THISISNOTAREALFILE"])).to
      .eventually.be.rejected;
  });

  it("sets the name for empty constructor", () => {
    const group = new ApiGroup();
    expect(group.name.original).to.equal("");
  });

  it("creates group without name", () => {
    const group = new ApiGroup([new Api(new model.document.Document())]);
    expect(group.name.original).to.equal("");
    expect(group.name.kebabCase).to.equal("");
    expect(group.name.lowerCamelCase).to.equal("");
    expect(group.name.snakeCase).to.equal("");
    expect(group.name.upperCamelCase).to.equal("");
  });

  it("finds an API by name", async () => {
    const group = await ApiGroup.init([validRamlFile, validRamlFile]);
    const api = group.get("Shop API");
    expect(api).to.not.be.empty;
    expect(api.name.original).to.equal("Shop API");
    expect(api.path).to.equal(validRamlFile);
  });
});
