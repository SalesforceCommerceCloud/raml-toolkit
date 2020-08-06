/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { extractFiles } from "./exchangeDirectoryParser";

import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";
import JSZip from "jszip";
import tmp from "tmp";
import path from "path";
import fs from "fs-extra";

async function createZipFile(
  directory: tmp.DirResult,
  file = "some-api.zip"
): Promise<void> {
  const zip = new JSZip();

  return new Promise((resolve) =>
    zip
      .file("exchange.json", "{}")
      .generateNodeStream({ type: "nodebuffer", streamFiles: true })
      .pipe(fs.createWriteStream(path.join(directory.name, file)))
      .on("finish", resolve)
  );
}

before(() => {
  chai.use(chaiAsPromised);
});

describe("extractFiles", () => {
  it("should extract a zip file into the specified directory", async () => {
    const directory = tmp.dirSync();
    await createZipFile(directory);

    await extractFiles(directory.name);
    const content = fs.readFileSync(
      path.join(directory.name, "some-api", "exchange.json")
    );

    expect(content.toString()).to.equal("{}");
  });

  context("when multiple zip files are present", () => {
    it("should extract all the files into their own directories", async () => {
      const directory = tmp.dirSync();
      await createZipFile(directory, "api1.zip");
      await createZipFile(directory, "api2.zip");

      await extractFiles(directory.name);
      const api1Content = fs.readFileSync(
        path.join(directory.name, "api1", "exchange.json")
      );
      const api2Content = fs.readFileSync(
        path.join(directory.name, "api2", "exchange.json")
      );

      expect(api1Content.toString()).to.equal("{}");
      expect(api2Content.toString()).to.equal("{}");
    });
  });

  it("should remove the zip file if removeFiles is not passed", async () => {
    const directory = tmp.dirSync();
    await createZipFile(directory);

    await extractFiles(directory.name);

    expect(fs.existsSync(path.join(directory.name, "some-api.zip"))).to.be
      .false;
  });

  it("should remove the zip file if removeFiles is true", async () => {
    const directory = tmp.dirSync();
    await createZipFile(directory);

    await extractFiles(directory.name, true);

    expect(fs.existsSync(path.join(directory.name, "some-api.zip"))).to.be
      .false;
  });

  it("should not remove the zip file if removeFiles is false", async () => {
    const directory = tmp.dirSync();
    await createZipFile(directory);

    await extractFiles(directory.name, false);

    expect(fs.existsSync(path.join(directory.name, "some-api.zip"))).to.be.true;
  });

  it("should ignore any subdirectories", async () => {
    const directory = tmp.dirSync();
    fs.mkdirSync(path.join(directory.name, "empty-dir"));
    await createZipFile(directory);

    await extractFiles(directory.name);

    expect(
      fs.readdirSync(path.join(directory.name, "empty-dir")).length
    ).to.equal(0);
  });

  it("should ignore any file with extension other than .zip", async () => {
    const directory = tmp.dirSync();
    fs.createFile(path.join(directory.name, "some-file.txt"));
    await createZipFile(directory);

    await extractFiles(directory.name);
    const content = fs.readFileSync(
      path.join(directory.name, "some-api", "exchange.json")
    );

    expect(content.toString()).to.equal("{}");
  });
});
