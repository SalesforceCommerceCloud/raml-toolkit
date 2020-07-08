/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Template } from "./template";
import { fileSync } from "tmp";
import { writeFileSync } from "fs-extra";
import Handlebars from "handlebars";
import chai from "chai";
import chaiFs from "chai-fs";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiFs);
chai.use(chaiAsPromised);
const expect = chai.expect;

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
  const errMsg = "Error rendering template";
  it("throws error when destination file path is undefined", async () => {
    const tmpFile = fileSync({ postfix: ".hbs" });
    writeFileSync(tmpFile.name, "Test");
    const template = new Template(tmpFile.name);
    return expect(template.render(undefined, undefined)).to.be.rejectedWith(
      errMsg
    );
  });

  it("throws error when destination file path is empty", async () => {
    const tmpFile = fileSync({ postfix: ".hbs" });
    writeFileSync(tmpFile.name, "Test");
    const template = new Template(tmpFile.name);
    return expect(template.render(undefined, "")).to.be.rejectedWith(errMsg);
  });

  it("throws error when destination file path is null", async () => {
    const tmpFile = fileSync({ postfix: ".hbs" });
    writeFileSync(tmpFile.name, "Test");
    const template = new Template(tmpFile.name);
    return expect(template.render(undefined, null)).to.be.rejectedWith(errMsg);
  });

  it("creates and renders when destination file does not exist", async () => {
    const tmpFile = fileSync({ postfix: ".hbs" });
    const templateContent = "{{name}}";
    writeFileSync(tmpFile.name, templateContent);
    const template = new Template(tmpFile.name);

    const data = { name: "Test rendering" };
    const dest = "/tmp/rendered_testing.ts";
    await template.render(data, dest);
    expect(dest)
      .to.be.a.file()
      .with.content(data.name);
  });

  it("renders template with default handlebars environment", async () => {
    //create template
    const tmpFile = fileSync({ postfix: ".hbs" });
    const templateContent = "{{name}}";
    writeFileSync(tmpFile.name, templateContent);
    const template = new Template(tmpFile.name);
    //render template
    const data = { name: "Test rendering" };
    const renderedFile = fileSync();
    await template.render(data, renderedFile.name);

    //verify the rendered content
    expect(renderedFile.name)
      .to.be.a.file()
      .with.content(data.name);
  });

  it("renders template with the given handlebars environment", async () => {
    //create template
    const tmpFile = fileSync({ postfix: ".hbs" });
    const templateContent = "{{{changeName name}}}";
    writeFileSync(tmpFile.name, templateContent);
    //Creates an isolated Handlebars environment.
    const customHb = Handlebars.create();
    customHb.registerHelper("changeName", name => {
      return `Testing custom handlebars - ${name}`;
    });
    const template = new Template(tmpFile.name, customHb);

    //render template
    const data = { name: "Test rendering" };
    const renderedFile = fileSync();
    await template.render(data, renderedFile.name);

    //verify the rendered content
    expect(renderedFile.name)
      .to.be.a.file()
      .with.content(`Testing custom handlebars - ${data.name}`);
  });
});
