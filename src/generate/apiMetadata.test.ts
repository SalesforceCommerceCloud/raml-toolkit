/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";
import chaiFs from "chai-fs";

import { Name } from "../common/structures/name";
import { ApiMetadata } from "./";
import path from "path";
import tmp from "tmp";
import fs from "fs-extra";
import sinon from "sinon";
import { ramlToolLogger } from "../common/logger";

const sandbox = sinon.createSandbox();

const handlebarTemplate = path.join(
  __dirname,
  "../../testResources/handlebarTemplates/test.hbs"
);

before(() => {
  chai.use(chaiAsPromised);
  chai.use(chaiFs);
});

describe("ApiMetadata", () => {
  afterEach(() => {
    sandbox.restore();
  });

  it("is created with only a name", async () => {
    const testTree = new ApiMetadata("foo");

    expect(testTree.name).to.be.deep.equal(new Name("foo"));
    expect(testTree.metadata).to.be.deep.equal({});
  });

  it("is created with no children", async () => {
    const tmpDir = tmp.dirSync();
    await fs.ensureDir(path.join(tmpDir.name, "apis"));

    const testTree = new ApiMetadata("apis", path.join(tmpDir.name, "apis"));
    expect(testTree.metadata).to.be.deep.equal({});
    expect(testTree.children).to.be.empty;
    expect(testTree.name).to.be.deep.equal(new Name("apis"));
  });

  it("is created with children", async () => {
    const tmpDir = tmp.dirSync();
    await fs.ensureDir(path.join(tmpDir.name, "apis"));
    await fs.ensureDir(path.join(tmpDir.name, "child1"));
    await fs.ensureDir(path.join(tmpDir.name, "child2"));
    const child1 = new ApiMetadata("child1", path.join(tmpDir.name, "child1"));
    const child2 = new ApiMetadata("child2", path.join(tmpDir.name, "child2"));

    const testTree = new ApiMetadata("apis", path.join(tmpDir.name, "apis"), [
      child1,
      child2,
    ]);
    expect(testTree.metadata).to.be.deep.equal({});
    expect(testTree.children).to.have.length(2);
    expect(testTree.children).to.deep.equal([child1, child2]);
    expect(testTree.name).to.be.deep.equal(new Name("apis"));
  });

  it("is created with metadata", async () => {
    const tmpDir = tmp.dirSync();
    await fs.ensureDir(path.join(tmpDir.name, "apis"));
    const myMetadata = {
      hidden: "You found me!",
    };

    await fs.writeJSON(
      path.join(tmpDir.name, "apis", ".metadata.json"),
      myMetadata
    );

    const testTree = new ApiMetadata("apis", path.join(tmpDir.name, "apis"));

    expect(testTree.name).to.be.deep.equal(new Name("apis"));
    expect(testTree.metadata).to.deep.equal(myMetadata);
  });

  it("is created with malformed metadata", async () => {
    const tmpDir = tmp.dirSync();
    await fs.ensureDir(path.join(tmpDir.name, "apis"));

    await fs.writeFile(
      path.join(tmpDir.name, "apis", ".metadata.json"),
      "Hmmm, isn't this supposed to be json?"
    );
    const warnStub = sandbox.stub(ramlToolLogger, "warn");

    const testTree = new ApiMetadata("apis", path.join(tmpDir.name, "apis"));
    expect(testTree.metadata).to.be.deep.equal({});
    expect(testTree.children).to.be.empty;
    expect(testTree.name).to.be.deep.equal(new Name("apis"));
    expect(warnStub.callCount).to.be.equal(1);
    expect(
      warnStub.calledWith(
        `Metadata found, but failed to load for ${path.join(
          tmpDir.name,
          "apis"
        )}`
      )
    ).to.be.true;
  });

  it("is created with empty metadata (invalid json)", async () => {
    const tmpDir = tmp.dirSync();
    await fs.ensureDir(path.join(tmpDir.name, "apis"));

    await fs.writeFile(path.join(tmpDir.name, "apis", ".metadata.json"), "");

    const warnStub = sandbox.stub(ramlToolLogger, "warn");

    const testTree = new ApiMetadata("apis", path.join(tmpDir.name, "apis"));

    expect(testTree.metadata).to.be.deep.equal({});
    expect(testTree.name).to.be.deep.equal(new Name("apis"));
    expect(warnStub.callCount).to.be.equal(1);
    expect(
      warnStub.calledWith(
        `Metadata found, but failed to load for ${path.join(
          tmpDir.name,
          "apis"
        )}`
      )
    ).to.be.true;
  });

  it("is created with empty metadata (valid json)", async () => {
    const tmpDir = tmp.dirSync();
    await fs.ensureDir(path.join(tmpDir.name, "apis"));
    await fs.writeJSON(path.join(tmpDir.name, "apis", ".metadata.json"), {});
    const testTree = new ApiMetadata("apis", path.join(tmpDir.name, "apis"));

    expect(testTree.metadata).to.be.deep.equal({});
    expect(testTree.name).to.be.deep.equal(new Name("apis"));
  });

  it("is created with no parent", () => {
    const testTree = new ApiMetadata("foo");
    expect(testTree.parent).to.be.null;
  });

  it("adds itself as parent to its children", () => {
    const child = new ApiMetadata("child");
    const parent = new ApiMetadata("parent", null, [child]);
    expect(child.parent).to.equal(parent);
  });

  it("adds a template that doesn't exist", async () => {
    const tmpDir = tmp.dirSync();
    await fs.ensureDir(path.join(tmpDir.name, "apis"));
    const testTree = new ApiMetadata("apis", path.join(tmpDir.name, "apis"));
    expect(() =>
      testTree.addTemplate("testTemplate.ts.hbs", "testTemplate.ts")
    ).to.throw("no such file or directory");
  });
});

describe("ApiMetaData render tests", () => {
  let apiMetadata: ApiMetadata;
  let tmpDir: tmp.DirResult;

  beforeEach(async () => {
    // Block logging
    sinon.restore();
    sandbox.stub(ramlToolLogger, "info");

    tmpDir = tmp.dirSync();
    await fs.ensureDir(path.join(tmpDir.name, "apis"));
    await fs.ensureDir(path.join(tmpDir.name, "child1"));
    await fs.ensureDir(path.join(tmpDir.name, "child2"));

    const child1 = new ApiMetadata("child1", path.join(tmpDir.name, "child1"));
    const child2 = new ApiMetadata("child2", path.join(tmpDir.name, "child2"));

    apiMetadata = new ApiMetadata("apis", path.join(tmpDir.name, "apis"), [
      child1,
      child2,
    ]);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("does nothing without templates for the entire tree", async () => {
    const ensureDirSpy = sandbox.spy(fs, "ensureDir");
    const writeFileSpy = sandbox.spy(fs, "writeFile");
    await apiMetadata.render();

    expect(ensureDirSpy.notCalled).to.be.true;
    expect(writeFileSpy.notCalled).to.be.true;
  });

  it("renders root template only", async () => {
    const ensureDirSpy = sandbox.spy(fs, "ensureDir");
    const writeFileSpy = sandbox.spy(fs, "writeFile");
    apiMetadata.addTemplate(
      handlebarTemplate,
      path.join(tmpDir.name, "apis.txt")
    );

    await apiMetadata.render();

    expect(ensureDirSpy.calledOnce).to.be.true;
    expect(writeFileSpy.calledOnce).to.be.true;

    expect(path.join(tmpDir.name, "apis.txt"))
      .to.be.a.file()
      .with.content("apis");
  });

  it("renders child templates only", async () => {
    const ensureDirSpy = sandbox.spy(fs, "ensureDir");
    const writeFileSpy = sandbox.spy(fs, "writeFile");

    apiMetadata.children[0].addTemplate(
      handlebarTemplate,
      path.join(tmpDir.name, "child1.txt")
    );

    apiMetadata.children[1].addTemplate(
      handlebarTemplate,
      path.join(tmpDir.name, "child2.txt")
    );

    await apiMetadata.render();

    expect(ensureDirSpy.calledTwice).to.be.true;
    expect(writeFileSpy.calledTwice).to.be.true;

    expect(path.join(tmpDir.name, "child1.txt"))
      .to.be.a.file()
      .with.content("child1");

    expect(path.join(tmpDir.name, "child2.txt"))
      .to.be.a.file()
      .with.content("child2");
  });

  it("renders all templates", async () => {
    const ensureDirSpy = sandbox.spy(fs, "ensureDir");
    const writeFileSpy = sandbox.spy(fs, "writeFile");

    apiMetadata.addTemplate(
      handlebarTemplate,
      path.join(tmpDir.name, "apis.txt")
    );

    apiMetadata.children[0].addTemplate(
      handlebarTemplate,
      path.join(tmpDir.name, "child1.txt")
    );

    apiMetadata.children[1].addTemplate(
      handlebarTemplate,
      path.join(tmpDir.name, "child2.txt")
    );

    await apiMetadata.render();

    expect(ensureDirSpy.calledThrice).to.be.true;
    expect(writeFileSpy.calledThrice).to.be.true;

    expect(path.join(tmpDir.name, "apis.txt"))
      .to.be.a.file()
      .with.content("apis");

    expect(path.join(tmpDir.name, "child1.txt"))
      .to.be.a.file()
      .with.content("child1");

    expect(path.join(tmpDir.name, "child2.txt"))
      .to.be.a.file()
      .with.content("child2");
  });
});
