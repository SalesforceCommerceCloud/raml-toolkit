/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "chai";

import Name from "./name";

describe("Test Name class", () => {
  it("sets all fields to empty string from the default constructor", () => {
    const name = new Name();
    expect(name.original).to.equal("");
    expect(name.kebabCase).to.equal("");
    expect(name.lowerCamelCase).to.equal("");
    expect(name.snakeCase).to.equal("");
    expect(name.upperCamelCase).to.equal("");
    expect(name.toString()).to.equal("");
    expect(name + "T").to.equal("T");
  });

  it("sets all fields from the constructor with lowercase", () => {
    const name = new Name("lowercase");
    expect(name.original).to.equal("lowercase");
    expect(name.kebabCase).to.equal("lowercase");
    expect(name.lowerCamelCase).to.equal("lowercase");
    expect(name.snakeCase).to.equal("lowercase");
    expect(name.upperCamelCase).to.equal("Lowercase");
    expect(name.toString()).to.equal("lowercase");
    expect(name + "T").to.equal("lowercaseT");
  });

  it("sets all fields from the constructor with Uppercase", () => {
    const name = new Name("Uppercase");
    expect(name.original).to.equal("Uppercase");
    expect(name.kebabCase).to.equal("uppercase");
    expect(name.lowerCamelCase).to.equal("uppercase");
    expect(name.snakeCase).to.equal("uppercase");
    expect(name.upperCamelCase).to.equal("Uppercase");
    expect(name.toString()).to.equal("Uppercase");
    expect(name + "T").to.equal("UppercaseT");
  });

  it("sets all fields from the constructor with a name with spaces", () => {
    const name = new Name("Name with Spaces");
    expect(name.original).to.equal("Name with Spaces");
    expect(name.kebabCase).to.equal("name-with-spaces");
    expect(name.lowerCamelCase).to.equal("nameWithSpaces");
    expect(name.snakeCase).to.equal("name_with_spaces");
    expect(name.upperCamelCase).to.equal("NameWithSpaces");
    expect(name.toString()).to.equal("Name with Spaces");
    expect(name + "T").to.equal("Name with SpacesT");
  });

  it("sets all fields from the constructor with a kebab-case name", () => {
    const name = new Name("kebab-case");
    expect(name.original).to.equal("kebab-case");
    expect(name.kebabCase).to.equal("kebab-case");
    expect(name.lowerCamelCase).to.equal("kebabCase");
    expect(name.snakeCase).to.equal("kebab_case");
    expect(name.upperCamelCase).to.equal("KebabCase");
    expect(name.toString()).to.equal("kebab-case");
    expect(name + "T").to.equal("kebab-caseT");
  });

  it("sets all fields from the constructor with a snake_case name", () => {
    const name = new Name("snake_case");
    expect(name.original).to.equal("snake_case");
    expect(name.kebabCase).to.equal("snake-case");
    expect(name.lowerCamelCase).to.equal("snakeCase");
    expect(name.snakeCase).to.equal("snake_case");
    expect(name.upperCamelCase).to.equal("SnakeCase");
    expect(name.toString()).to.equal("snake_case");
    expect(name + "T").to.equal("snake_caseT");
  });

  it("sets all fields from the constructor with an empty string", () => {
    const name = new Name("");
    expect(name.original).to.equal("");
    expect(name.kebabCase).to.equal("");
    expect(name.lowerCamelCase).to.equal("");
    expect(name.snakeCase).to.equal("");
    expect(name.upperCamelCase).to.equal("");
    expect(name.toString()).to.equal("");
    expect(name + "T").to.equal("T");
  });

  it("sets all fields to empty string from the constructor with an undefined input", () => {
    const name = new Name(undefined);
    expect(name.original).to.equal("");
    expect(name.kebabCase).to.equal("");
    expect(name.lowerCamelCase).to.equal("");
    expect(name.snakeCase).to.equal("");
    expect(name.upperCamelCase).to.equal("");
    expect(name.toString()).to.equal("");
    expect(name + "T").to.equal("T");
  });

  it("sets all fields when setting original directly", () => {
    const name = new Name();
    name.original = "I'm allowed to do this.";
    expect(name.original).to.equal("I'm allowed to do this.");
    expect(name.kebabCase).to.equal("im-allowed-to-do-this");
    expect(name.lowerCamelCase).to.equal("imAllowedToDoThis");
    expect(name.snakeCase).to.equal("im_allowed_to_do_this");
    expect(name.upperCamelCase).to.equal("ImAllowedToDoThis");
    expect(name.toString()).to.equal("I'm allowed to do this.");
    expect(name + "T").to.equal("I'm allowed to do this.T");
  });
});
