/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";

import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";

import { ApiGroup } from "./apiGroup";

const validRamlFile = path.join(__dirname, "../../test/site.raml");
const invalidRamlFile = path.join(__dirname, "../../test/search-invalid.raml");

before(() => {
  chai.use(chaiAsPromised);
});

describe("Test ApiGroup class read", () => {
  it("creates an instance from a valid raml file", async () => {
    const group = await ApiGroup.read([validRamlFile]);
    expect(group.apis).to.not.be.empty;
    expect(group.apis[0].model).to.not.be.empty;
    expect(group.apis[0].name.original).to.equal("Shop API");
    expect(group.apis[0].path).to.be.equal(validRamlFile);
  });

  it("creates an instance from two valid raml files", async () => {
    const group = await ApiGroup.read([validRamlFile, validRamlFile]);
    expect(group.apis).to.not.be.empty;
    expect(group.apis[0].model).to.not.be.empty;
    expect(group.apis[0].name.original).to.equal("Shop API");
    expect(group.apis[0].path).to.be.equal(validRamlFile);
    expect(group.apis[1].model).to.not.be.empty;
    expect(group.apis[1].name.original).to.equal("Shop API");
    expect(group.apis[1].path).to.be.equal(validRamlFile);
  });

  it("rejects from an invalid raml file", () => {
    return expect(ApiGroup.read([invalidRamlFile])).to.eventually.be.rejected;
  });

  it("rejects from one good, one bad raml file", () => {
    return expect(ApiGroup.read([validRamlFile, invalidRamlFile])).to.eventually
      .be.rejected;
  });

  it("rejects from an invalid file path", () => {
    return expect(ApiGroup.read(["THISISNOTAREALFILE"])).to.eventually.be
      .rejected;
  });

  it("rejects from an invalid file path plus a good one", () => {
    return expect(ApiGroup.read([validRamlFile, "THISISNOTAREALFILE"])).to
      .eventually.be.rejected;
  });
});

describe("Test Api class setName", () => {
  it("sets the name for empty constructor", () => {
    const group = new ApiGroup();
    expect(group.name).to.deep.equal({
      original: "",
      kebabCase: "",
      lowerCamelCase: "",
      snakeCase: "",
      upperCamelCase: ""
    });
  });

  it("sets the name for lowercase", () => {
    const group = new ApiGroup("lowercase");
    expect(group.name).to.deep.equal({
      original: "lowercase",
      kebabCase: "lowercase",
      lowerCamelCase: "lowercase",
      snakeCase: "lowercase",
      upperCamelCase: "Lowercase"
    });
  });

  it("sets the name for Uppercase", () => {
    const group = new ApiGroup("Uppercase");
    expect(group.name).to.deep.equal({
      original: "Uppercase",
      kebabCase: "uppercase",
      lowerCamelCase: "uppercase",
      snakeCase: "uppercase",
      upperCamelCase: "Uppercase"
    });
  });

  it("sets the name for Name with Spaces", () => {
    const group = new ApiGroup("Name with Spaces");
    expect(group.name).to.deep.equal({
      original: "Name with Spaces",
      kebabCase: "name-with-spaces",
      lowerCamelCase: "nameWithSpaces",
      snakeCase: "name_with_spaces",
      upperCamelCase: "NameWithSpaces"
    });
  });

  it("sets the name for kebab-case", () => {
    const group = new ApiGroup("kebab-case");
    expect(group.name).to.deep.equal({
      original: "kebab-case",
      kebabCase: "kebab-case",
      lowerCamelCase: "kebabCase",
      snakeCase: "kebab_case",
      upperCamelCase: "KebabCase"
    });
  });

  it("sets the name for snake_case", () => {
    const group = new ApiGroup("snake_case");
    expect(group.name).to.deep.equal({
      original: "snake_case",
      kebabCase: "snake-case",
      lowerCamelCase: "snakeCase",
      snakeCase: "snake_case",
      upperCamelCase: "SnakeCase"
    });
  });

  it("sets the name for empty string", () => {
    const group = new ApiGroup("");
    expect(group.name).to.deep.equal({
      original: "",
      kebabCase: "",
      lowerCamelCase: "",
      snakeCase: "",
      upperCamelCase: ""
    });
  });

  it("defaults to empty string for undefined", () => {
    const group = new ApiGroup();
    group.setName(undefined);
    expect(group.name).to.deep.equal({
      original: "",
      kebabCase: "",
      lowerCamelCase: "",
      snakeCase: "",
      upperCamelCase: ""
    });
  });
});
