/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";

import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";

import { Api } from "./api";

const validRamlFile = path.join(__dirname, "../../test/site.raml");
const invalidRamlFile = path.join(__dirname, "../../test/search-invalid.raml");

before(() => {
  chai.use(chaiAsPromised);
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

describe("Test Api class setName", () => {
  it("sets the name for lowercase", () => {
    const api = new Api();
    expect(api.setName("lowercase").name).to.deep.equal({
      original: "lowercase",
      kebabCase: "lowercase",
      lowerCamelCase: "lowercase",
      snakeCase: "lowercase",
      upperCamelCase: "Lowercase"
    });
  });

  it("sets the name for Uppercase", () => {
    const api = new Api();
    expect(api.setName("Uppercase").name).to.deep.equal({
      original: "Uppercase",
      kebabCase: "uppercase",
      lowerCamelCase: "uppercase",
      snakeCase: "uppercase",
      upperCamelCase: "Uppercase"
    });
  });

  it("sets the name for Name with Spaces", () => {
    const api = new Api();
    expect(api.setName("Name with Spaces").name).to.deep.equal({
      original: "Name with Spaces",
      kebabCase: "name-with-spaces",
      lowerCamelCase: "nameWithSpaces",
      snakeCase: "name_with_spaces",
      upperCamelCase: "NameWithSpaces"
    });
  });

  it("sets the name for kebab-case", () => {
    const api = new Api();
    expect(api.setName("kebab-case").name).to.deep.equal({
      original: "kebab-case",
      kebabCase: "kebab-case",
      lowerCamelCase: "kebabCase",
      snakeCase: "kebab_case",
      upperCamelCase: "KebabCase"
    });
  });

  it("sets the name for snake_case", () => {
    const api = new Api();
    expect(api.setName("snake_case").name).to.deep.equal({
      original: "snake_case",
      kebabCase: "snake-case",
      lowerCamelCase: "snakeCase",
      snakeCase: "snake_case",
      upperCamelCase: "SnakeCase"
    });
  });

  it("sets the name for empty string", () => {
    const api = new Api();
    expect(api.setName("").name).to.deep.equal({
      original: "",
      kebabCase: "",
      lowerCamelCase: "",
      snakeCase: "",
      upperCamelCase: ""
    });
  });

  it("sets the name for undefined", () => {
    const api = new Api();
    expect(api.setName(undefined).name).to.deep.equal({
      original: "",
      kebabCase: "",
      lowerCamelCase: "",
      snakeCase: "",
      upperCamelCase: ""
    });
  });
});
