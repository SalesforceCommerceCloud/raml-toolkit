/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";

import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";
import chaiFs from "chai-fs";

import fs from "fs-extra";

import { ApiModel } from "./apiModel";
import { Name } from "../common/structures/name";
import tmp from "tmp";
import sinon from "sinon";

const sandbox = sinon.createSandbox();

const validRamlFile = path.join(
  __dirname,
  "../../testResources/raml/site/site.raml"
);

const invalidRamlFile = path.join(
  __dirname,
  "../../testResources/raml/invalid/search-invalid.raml"
);

const handlebarTemplate = path.join(
  __dirname,
  "../../testResources/handlebarTemplates/test.hbs"
);

before(() => {
  chai.use(chaiAsPromised);
  chai.use(chaiFs);
});

describe("ApiModel tests", () => {
  it("constructs successfully with directory", () => {
    const api = new ApiModel("valid", path.dirname(validRamlFile));
    expect(api.dataTypes).to.be.empty;
    expect(api.model).to.be.undefined;
    expect(api.name).to.deep.equal(new Name("valid"));
  });

  it("constructs successfully with raml file", () => {
    const api = new ApiModel("valid", validRamlFile);
    expect(api.dataTypes).to.be.empty;
    expect(api.model).to.be.undefined;
    expect(api.name).to.deep.equal(new Name("valid"));
  });

  it("constructs unsuccessfully because empty content", () => {
    const tmpDir = tmp.dirSync();

    expect(() => new ApiModel("FAILURE", tmpDir.name)).to.throw(
      "No exchange.json or no raml file provided, can't load api"
    );
  });

  it("constructs unsuccessfully because of bad path", () => {
    expect(() => new ApiModel("FAILURE", "NOT_A_DIRECTORY")).to.throw(
      "ENOENT: no such file or directory, lstat 'NOT_A_DIRECTORY'"
    );
  });

  it("constructs successfully even with an invalid raml file", () => {
    const api = new ApiModel("FAILURE", path.dirname(invalidRamlFile));
    expect(api.dataTypes).to.be.empty;
    expect(api.model).to.be.undefined;
    expect(api.name).to.deep.equal(new Name("FAILURE"));
  });

  it("initializes the model successfully", async () => {
    const api = new ApiModel("VALID", path.dirname(validRamlFile));
    await api.init();
    expect(api.dataTypes).to.not.be.empty;
    expect(api.model).to.not.be.empty;
    expect(api.name).to.deep.equal(new Name("Shop API"));
  });

  it("initializes the model successfully without updating the name", async () => {
    const api = new ApiModel("VALID", path.dirname(validRamlFile));
    await api.init(false);
    expect(api.dataTypes).to.not.be.empty;
    expect(api.model).to.not.be.empty;
    expect(api.name).to.deep.equal(new Name("VALID"));
  });

  it("throws when initializing with an invalid raml file", async () => {
    const api = new ApiModel("VALID", path.dirname(invalidRamlFile));
    return expect(api.init()).to.eventually.be.rejected;
  });

  it("throws when updating the name without a model", () => {
    const api = new ApiModel("VALID", path.dirname(invalidRamlFile));
    expect(() => api.updateName()).to.throw(
      "Cannot update the name before the model is loaded"
    );
  });
});

describe("ApiModel render tests", () => {
  let apiModel: ApiModel;
  beforeEach(() => {
    apiModel = new ApiModel("VALID", path.dirname(validRamlFile));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("does nothing without templates", async () => {
    const ensureDirSyncSpy = sandbox.spy(fs, "ensureDirSync");
    const writeFileSyncSpy = sandbox.spy(fs, "writeFileSync");
    await apiModel.renderThis();

    expect(ensureDirSyncSpy.notCalled).to.be.true;
    expect(writeFileSyncSpy.notCalled).to.be.true;
  });

  it("renders with a single template (init first)", async () => {
    const tmpDir = tmp.dirSync();
    await apiModel.init();
    apiModel.addTemplate(handlebarTemplate, path.join(tmpDir.name, "name.txt"));
    await apiModel.renderThis();

    expect(path.join(tmpDir.name, "name.txt"))
      .to.be.a.file()
      .with.content("Shop API");
  });

  it("renders with a single template (without init)", async () => {
    const tmpDir = tmp.dirSync();
    apiModel.addTemplate(handlebarTemplate, path.join(tmpDir.name, "name.txt"));
    await apiModel.renderThis();

    expect(path.join(tmpDir.name, "name.txt"))
      .to.be.a.file()
      .with.content("Shop API");
  });

  it("renders with multiple templates", async () => {
    const tmpDir = tmp.dirSync();
    apiModel.addTemplate(handlebarTemplate, path.join(tmpDir.name, "name.txt"));
    apiModel.addTemplate(
      handlebarTemplate,
      path.join(tmpDir.name, "other-name.txt")
    );
    await apiModel.renderThis();

    expect(path.join(tmpDir.name, "name.txt"))
      .to.be.a.file()
      .with.content("Shop API");

    expect(path.join(tmpDir.name, "other-name.txt"))
      .to.be.a.file()
      .with.content("Shop API");
  });
});
