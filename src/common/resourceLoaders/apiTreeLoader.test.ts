/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";

import { createApiTree } from "./apiTreeLoader";
import path from "path";
import tmp from "tmp";
import fs from "fs-extra";
import sinon from "sinon";
import { Name } from "../structures/name";

const validRamlDir = path.join(
  __dirname,
  "../../../testResources/raml/mercury"
);

async function copyMercuryApi(destination: string): Promise<void> {
  await fs.ensureDir(destination);
  const exchange = await fs.readFile(path.join(validRamlDir, "exchange.json"));
  const raml = await fs.readFile(path.join(validRamlDir, "mercury.raml"));
  await fs.writeFile(path.join(destination, "exchange.json"), exchange);
  await fs.writeFile(path.join(destination, "mercury.raml"), raml);
}

before(() => {
  chai.use(chaiAsPromised);
});

describe("Test createApiTree", () => {
  beforeEach(() => {
    sinon.reset();
  });

  it("is created with no children", async () => {
    const tempDir = tmp.dirSync();
    await fs.ensureDir(path.join(tempDir.name, "apis"));

    const testTree = await createApiTree(path.join(tempDir.name, "apis"));
    expect(testTree.metadata).to.be.undefined;
    expect(testTree.children).to.be.empty;
    expect(testTree.name).to.be.deep.equal(new Name("apis"));
  });

  it("is created with 2 children", async () => {
    const tempDir = tmp.dirSync();
    await fs.ensureDir(path.join(tempDir.name, "apis"));
    await fs.ensureDir(path.join(tempDir.name, "apis", "child1"));
    await fs.ensureDir(path.join(tempDir.name, "apis", "child2"));

    const testTree = await createApiTree(path.join(tempDir.name, "apis"));
    expect(testTree.metadata).to.be.undefined;
    expect(testTree.children).to.have.length(2);
    expect(testTree.children[0].name).to.deep.equal(new Name("child1"));
    expect(testTree.children[1].name).to.deep.equal(new Name("child2"));
    expect(testTree.name).to.be.deep.equal(new Name("apis"));
  });

  it("is created with a child that has an api", async () => {
    const tempDir = tmp.dirSync();
    await fs.ensureDir(path.join(tempDir.name, "apis"));
    await fs.ensureDir(path.join(tempDir.name, "apis", "child1"));
    await copyMercuryApi(path.join(tempDir.name, "apis", "child1", "mercury"));
    const testTree = await createApiTree(path.join(tempDir.name, "apis"));
    expect(testTree.metadata).to.be.undefined;
    expect(testTree.children).to.have.length(1);
    expect(testTree.children[0].children).to.have.length(1);
    expect(testTree.children[0].children[0].name).to.be.deep.equal(
      // The name of the api in the test raml (ensures we've loaded it)
      new Name("Test Raml File")
    );
  });
});
