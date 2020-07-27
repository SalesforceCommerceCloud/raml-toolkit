/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";

import { loadApiDirectory } from "./loadApiDirectory";
import path from "path";
import tmp from "tmp";
import fs from "fs-extra";
import { Name } from "../common/structures/name";

const validRamlDir = path.join(__dirname, "../../testResources/raml/mercury");

async function copyMercuryApi(destination: string): Promise<void> {
  await fs.ensureDir(destination);
  await fs.copy(validRamlDir, destination);
}

before(() => {
  chai.use(chaiAsPromised);
});

describe("Test loadApiDirectory", () => {
  it("creates ApiTree with no children", async () => {
    const tempDir = tmp.dirSync();
    await fs.ensureDir(path.join(tempDir.name, "apis"));

    const testTree = loadApiDirectory(path.join(tempDir.name, "apis"));
    expect(testTree.metadata).to.be.undefined;
    expect(testTree.children).to.be.empty;
    expect(testTree.name).to.deep.equal(new Name("apis"));
  });

  it("creates ApiTree with 2 children", async () => {
    const tempDir = tmp.dirSync();
    await fs.ensureDir(path.join(tempDir.name, "apis"));
    await fs.ensureDir(path.join(tempDir.name, "apis", "child1"));
    await fs.ensureDir(path.join(tempDir.name, "apis", "child2"));

    const testTree = loadApiDirectory(path.join(tempDir.name, "apis"));
    expect(testTree.metadata).to.be.undefined;
    expect(testTree.children).to.have.lengthOf(2);
    expect(testTree.children[0].name).to.deep.equal(new Name("child1"));
    expect(testTree.children[1].name).to.deep.equal(new Name("child2"));
    expect(testTree.name).to.deep.equal(new Name("apis"));
  });

  it("creates ApiTree with a child that has an API", async () => {
    const tempDir = tmp.dirSync();
    await fs.ensureDir(path.join(tempDir.name, "apis", "child1"));
    await copyMercuryApi(path.join(tempDir.name, "apis", "child1", "mercury"));
    const testTree = loadApiDirectory(path.join(tempDir.name, "apis"));
    expect(testTree.metadata).to.be.undefined;
    expect(testTree.children).to.have.lengthOf(1);
    expect(testTree.children[0].children).to.have.lengthOf(1);
    expect(testTree.children[0].children[0].name).to.deep.equal(
      // The name of the api in the test raml (ensures we've loaded it)
      new Name("mercury")
    );
  });

  it("Attempts to create an api tree for a path that doesn't exist", async () => {
    const tempDir = tmp.dirSync();

    return expect(() =>
      loadApiDirectory(path.join(tempDir.name, "MISSING"))
    ).to.throw(`${path.join(tempDir.name, "MISSING")} Api path does not exist`);
  });
});
