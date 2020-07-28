/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";

import { Name } from "./name";
import { ApiTree } from "./apiTree";
import path from "path";
import tmp from "tmp";
import fs from "fs-extra";
import sinon from "sinon";
import { ramlToolLogger } from "../logger";

export class TestTree extends ApiTree {
  constructor(filepath: string, children?: ApiTree[]) {
    const name = new Name(path.basename(filepath));
    super(name, filepath, children);
  }
}

before(() => {
  chai.use(chaiAsPromised);
});

describe("Test ApiTree", () => {
  beforeEach(() => {
    sinon.reset();
  });

  it("is created with no children", async () => {
    const tempDir = tmp.dirSync();
    await fs.ensureDir(path.join(tempDir.name, "apis"));

    const testTree = new TestTree(path.join(tempDir.name, "apis"));
    expect(testTree.metadata).to.be.undefined;
    expect(testTree.children).to.be.empty;
    expect(testTree.name).to.be.deep.equal(new Name("apis"));
  });

  it("is created with children", async () => {
    const tempDir = tmp.dirSync();
    await fs.ensureDir(path.join(tempDir.name, "apis"));
    await fs.ensureDir(path.join(tempDir.name, "child1"));
    await fs.ensureDir(path.join(tempDir.name, "child2"));
    const child1 = new TestTree(path.join(tempDir.name, "child1"));
    const child2 = new TestTree(path.join(tempDir.name, "child2"));

    const testTree = new TestTree(path.join(tempDir.name, "apis"), [
      child1,
      child2
    ]);
    expect(testTree.metadata).to.be.undefined;
    expect(testTree.children).to.have.length(2);
    expect(testTree.children).to.deep.equal([child1, child2]);
    expect(testTree.name).to.be.deep.equal(new Name("apis"));
  });

  it("is created with metadata", async () => {
    const tempDir = tmp.dirSync();
    await fs.ensureDir(path.join(tempDir.name, "apis"));
    const myMetadata = {
      hidden: "You found me!"
    };

    await fs.writeJSON(
      path.join(tempDir.name, "apis", ".metadata.json"),
      myMetadata
    );

    const testTree = new TestTree(path.join(tempDir.name, "apis"));

    expect(testTree.name).to.be.deep.equal(new Name("apis"));
    expect(testTree.metadata).to.deep.equal(myMetadata);
  });

  it("is created with malformed metadata", async () => {
    const tempDir = tmp.dirSync();
    await fs.ensureDir(path.join(tempDir.name, "apis"));

    await fs.writeFile(
      path.join(tempDir.name, "apis", ".metadata.json"),
      "Hmmm, isn't this supposed to be json?"
    );

    const stub = sinon.stub(ramlToolLogger, "warn");

    const testTree = new TestTree(path.join(tempDir.name, "apis"));
    expect(testTree.metadata).to.be.undefined;
    expect(testTree.children).to.be.empty;
    expect(testTree.name).to.be.deep.equal(new Name("apis"));
    expect(stub.callCount).to.be.equal(1);
    expect(
      stub.calledWith(
        `Metadata found, but failed to load for ${path.join(
          tempDir.name,
          "apis"
        )}`
      )
    ).to.be.true;
  });

  it("is created with empty metadata (invalid json)", async () => {
    const tempDir = tmp.dirSync();
    await fs.ensureDir(path.join(tempDir.name, "apis"));

    await fs.writeFile(path.join(tempDir.name, "apis", ".metadata.json"), "");

    const stub = sinon.stub(ramlToolLogger, "warn");
    const testTree = new TestTree(path.join(tempDir.name, "apis"));

    expect(testTree.metadata).to.be.undefined;
    expect(testTree.name).to.be.deep.equal(new Name("apis"));
    expect(stub.callCount).to.be.equal(1);
    expect(
      stub.calledWith(
        `Metadata found, but failed to load for ${path.join(
          tempDir.name,
          "apis"
        )}`
      )
    ).to.be.true;
  });

  it("is created with empty metadata (valid json)", async () => {
    const tempDir = tmp.dirSync();
    await fs.ensureDir(path.join(tempDir.name, "apis"));

    await fs.writeJSON(path.join(tempDir.name, "apis", ".metadata.json"), {});
    const testTree = new TestTree(path.join(tempDir.name, "apis"));

    expect(testTree.metadata).to.be.deep.equal({});
    expect(testTree.name).to.be.deep.equal(new Name("apis"));
  });
});
