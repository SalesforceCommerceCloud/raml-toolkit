/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "chai";
import { default as Handlebars } from "handlebars";
import { Formatter } from "./formatter";

describe("Formatter interface", () => {
  it("constructor creates a new instance", () => {
    const formatter = new Formatter();
    expect(formatter).to.be.an.instanceOf(Formatter);
  });

  it("instance handlebars defaults to static handlebars", () => {
    const formatter = new Formatter();
    expect(formatter.handlebars).to.equal(Formatter.handlebars);
  });

  it("instance handlebars can be overridden", () => {
    const handlebars = Handlebars.create();
    const formatter = new Formatter({ handlebars });
    expect(formatter.handlebars).to.equal(handlebars);
  });

  it("instance template cache defaults to static template cache", () => {
    const formatter = new Formatter();
    expect(formatter.templates).to.equal(Formatter.templates);
  });

  it("instance template cache can be overridden", () => {
    const templates = new Map();
    const formatter = new Formatter({ templates });
    expect(formatter.templates).to.equal(templates);
  });

  it("registers a partial from a file", () => {
    throw new Error("To be implemented");
  });

  it("registers a partial with a custom name", () => {
    throw new Error("To be implemented");
  });

  it("only registers a partial once", () => {
    throw new Error("To be implemented");
  });

  it("loads a template from a file", () => {
    throw new Error("To be implemented");
  });

  it("onlu loads a template once", () => {
    throw new Error("To be implemented");
  });

  it("renders a template from a file and data", () => {
    throw new Error("To be implemented");
  });
});
