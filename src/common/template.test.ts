/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "chai";
import { Template } from "./template";
import { fileSync } from "tmp";
import { writeFileSync } from "fs-extra";
import Handlebars from "handlebars";
import chai from "chai";
import chaiFs from "chai-fs";
chai.use(chaiFs);

describe("Create template instance", () => {
  const errMsg = "Error initializing template";
  it("throws error when template file path is undefined", async () => {
    return expect(() => new Template(undefined)).to.throw(errMsg);
  });
  it("throws error when template file path is empty", async () => {
    return expect(() => new Template("")).to.throw(errMsg);
  });
  it("throws error when template file path is null", async () => {
    return expect(() => new Template(null)).to.throw(errMsg);
  });
  it("throws error when the template file do not exist", async () => {
    return expect(() => new Template("/tmp/template.hbs")).to.throw(errMsg);
  });
  it("throws error when the template file has no content", async () => {
    const templateFile = fileSync({ postfix: ".hbs" });
    return expect(() => new Template(templateFile.name)).to.throw(
      "Invalid template content"
    );
  });
  it("creates instance of template with a valid template file", async () => {
    const templateFile = fileSync({ postfix: ".hbs" });
    const templateContent = "Test";
    writeFileSync(templateFile.name, templateContent);
    const template = new Template(templateFile.name);
    //verify template and its content
    expect(template).to.be.an.instanceof(Template);
    expect(template.content).to.equal(templateContent);
  });
});

describe("Render template", () => {
  it("Renders template with default handlebars environment", async () => {
    //create template
    const tmpFile = fileSync({ postfix: ".hbs" });
    const templateContent = "{{name}}";
    writeFileSync(tmpFile.name, templateContent);
    const template = new Template(tmpFile.name);
    //render template
    const data = { name: "Test rendering" };
    const renderedFile = fileSync();
    template.render(data, renderedFile.name);

    //verify the rendered content
    expect(renderedFile.name)
      .to.be.a.file()
      .with.content(data.name);
  });

  it("Renders template with the given handlebars environment", async () => {
    //create template
    const tmpFile = fileSync({ postfix: ".hbs" });
    const templateContent = "{{{getUpperCaseName name}}}";
    writeFileSync(tmpFile.name, templateContent);
    //Creates an isolated Handlebars environment.
    const customHb = Handlebars.create();
    customHb.registerHelper("getUpperCaseName", name => {
      return name.toUpperCase();
    });
    const template = new Template(tmpFile.name, customHb);

    //render template
    const data = { name: "Test rendering" };
    const renderedFile = fileSync();
    template.render(data, renderedFile.name);

    //verify the rendered content
    expect(renderedFile.name)
      .to.be.a.file()
      .with.content(data.name.toUpperCase());
  });
});
