/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";
import tmp from "tmp";
import fs from "fs-extra";
import Handlebars from "handlebars";
import sinon from "sinon";
import { expect } from "chai";
import { Formatter } from "./formatter";

function createTempFile(contents: string, name?: string): string {
  let filepath: string;
  if (name) {
    // Specifying a name means tmp.fileSync() can't guarantee a unique file,
    // so we have to create a unique directory first
    const dir = tmp.dirSync();
    filepath = path.join(dir.name, name);
  } else {
    const file = tmp.fileSync();
    filepath = file.name;
  }
  fs.writeFileSync(filepath, contents);
  return filepath;
}

describe("Formatter interface", () => {
  let formatter: Formatter<object>;

  beforeEach("per-test Formatter", () => {
    formatter = new Formatter({
      handlebars: Handlebars.create(),
      templates: new Map(),
    });
  });

  it("constructor creates a new instance", () => {
    const basicFormatter = new Formatter();
    expect(basicFormatter).to.be.an.instanceOf(Formatter);
    expect(basicFormatter).to.have.keys("handlebars", "templates");
  });

  it("instance handlebars defaults to static handlebars", () => {
    const basicFormatter = new Formatter();
    expect(basicFormatter.handlebars).to.equal(Formatter.handlebars);
  });

  it("instance handlebars can be overridden", () => {
    const handlebars = Handlebars.create();
    const hbOverridden = new Formatter({ handlebars });
    expect(hbOverridden.handlebars).to.equal(handlebars);
  });

  it("instance template cache defaults to static template cache", () => {
    const basicFormatter = new Formatter();
    expect(basicFormatter.templates).to.equal(Formatter.templates);
  });

  it("instance template cache can be overridden", () => {
    const templates = new Map();
    const tplOverridden = new Formatter({ templates });
    expect(tplOverridden.templates).to.equal(templates);
  });

  it("registers a partial from a file", () => {
    const file = createTempFile("This is a partial!", "basicPartialsTest");
    formatter.registerPartial(file);
    expect(formatter.handlebars.partials).to.deep.equal({
      basicPartialsTest: "This is a partial!",
    });
  });

  it("registers a partial with a custom name", () => {
    const file = createTempFile("This is also a partial!", "shouldBeUnset");
    formatter.registerPartial(file, "customPartialName");
    expect(formatter.handlebars.partials).to.deep.equal({
      customPartialName: "This is also a partial!",
    });
  });

  it("converts . in partial filenames to : to make handlebars happy", () => {
    const file = createTempFile("Yet another partial!", "dot.colon.hbs");
    formatter.registerPartial(file);
    expect(formatter.handlebars.partials).to.deep.equal({
      "dot:colon": "Yet another partial!",
    });
  });

  it("only registers a partial once", () => {
    const file = createTempFile("Partially lacking enthusiasm.", "once");
    formatter.registerPartial(file);
    expect(formatter.handlebars.partials).to.deep.equal({
      once: "Partially lacking enthusiasm.",
    });
    // Replace file contents so we can tell if it changed
    fs.writeFileSync(file, "Partially invisible");
    formatter.registerPartial(file);
    expect(formatter.handlebars.partials).to.deep.equal({
      once: "Partially lacking enthusiasm.",
    });
    // Should also fail if a different file is given with the same custom name
    const otherFile = createTempFile("This file is partially incompl");
    formatter.registerPartial(otherFile, "once");
    expect(formatter.handlebars.partials).to.deep.equal({
      once: "Partially lacking enthusiasm.",
    });
  });

  it("renders a template from a file and data", () => {
    const file = createTempFile("{{{filler}}}");
    const filled = formatter.render(file, { filler: "Hello world!" });
    expect(filled).to.equal("Hello world!");
  });

  it("caches loaded template files", () => {
    const spy = sinon.spy(fs, "readFileSync");
    const file = createTempFile("{{{person}}}, Benevolent Overlord");
    formatter.render(file, { person: "Doug Berman" });
    expect(spy.calledOnceWith(file)).to.be.true;
    formatter.render(file, { person: "Josh Begleiter" });
    expect(spy.calledOnceWith(file)).to.be.true;
    spy.restore();
  });
});
