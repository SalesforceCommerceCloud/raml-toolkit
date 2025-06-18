/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint header/header: "off", max-lines:"off" */

import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

const pq = proxyquire.noCallThru();

// Helper functions for test setup
function createMockFs(): {
  readdir: sinon.SinonStub;
  stat: sinon.SinonStub;
  writeFile: sinon.SinonStub;
  writeJson: sinon.SinonStub;
} {
  return {
    readdir: sinon.stub(),
    stat: sinon.stub(),
    writeFile: sinon.stub(),
    writeJson: sinon.stub(),
  };
}

function createMockExec(): sinon.SinonStub {
  const execStub = sinon.stub();
  execStub.callsArgWith(1, null, "version 1.0.0", ""); // Default version check
  return execStub;
}

/**
 * Sets up mock directory structure for fs operations in tests.
 *
 * This helper function configures sinon stubs for fs.readdir and fs.stat to simulate
 * a directory tree structure. Files are automatically detected by .json and .yaml extensions.
 *
 * @param fsStub - The mocked fs object with stubbed readdir and stat methods
 * @param structure - Array of directory objects
 *
 * @example
 * // Simple API directory structure
 * setupDirectoryStructure(fsStub, [
 *   { path: "base", contents: ["api-v1"] },
 *   { path: "base/api-v1", contents: ["exchange.json", "spec.yaml"] }
 * ]);
 *
 * @example
 * // Multiple APIs
 * setupDirectoryStructure(fsStub, [
 *   { path: "base", contents: ["api-v1", "api-v2"] },
 *   { path: "base/api-v1", contents: ["exchange.json"] },
 *   { path: "base/api-v2", contents: ["exchange.json"] }
 * ]);
 * this function equivalant to
 * // Manual readdir setup (sequential calls)
* fsStub.readdir.onCall(0).returns(["api-v1"]);           // First call: base directory
* fsStub.readdir.onCall(1).returns(["exchange.json", "spec.yaml"]); // Second call: base/api-v1 directory

* // Manual stat setup for each item
* fsStub.stat.withArgs("base/api-v1").returns({ isDirectory: () => true });  // api-v1 is a directory
* fsStub.stat.withArgs("base/api-v1/exchange.json").returns({ isDirectory: () => false }); // .json is a file
* fsStub.stat.withArgs("base/api-v1/spec.yaml").returns({ isDirectory: () => false });     // .yaml is a file
* // Default behavior - everything else is a directory
* fsStub.stat.returns({ isDirectory: () => true });
 */
function setupDirectoryStructure(
  fsStub: {
    readdir: sinon.SinonStub;
    stat: sinon.SinonStub;
  },
  structure: Array<{ path: string; contents: string[] }>
): void {
  for (const dir of structure) {
    fsStub.readdir.withArgs(dir.path).resolves(dir.contents);

    for (const item of dir.contents) {
      const itemPath = `${dir.path}/${item}`;
      const isFile =
        item.endsWith(".json") ||
        item.endsWith(".yaml") ||
        item.endsWith(".yml");
      fsStub.stat.withArgs(itemPath).resolves({
        isDirectory: () => !isFile,
        isFile: () => isFile,
      });
    }
  }

  fsStub.stat.resolves({
    isDirectory: () => true,
    isFile: () => false,
  });
}

function createOasDiffProxy(
  execStub: sinon.SinonStub,
  fsStub: {
    readdir: sinon.SinonStub;
    stat: sinon.SinonStub;
    writeFile: sinon.SinonStub;
    writeJson: sinon.SinonStub;
  }
) {
  return pq("./oasDiff", {
    child_process: {
      exec: execStub,
    },
    "fs-extra": fsStub,
  });
}

describe("oasDiffChangelog", () => {
  let consoleErrorSpy;
  beforeEach(() => {
    consoleErrorSpy = sinon.spy(console, "error");
  });
  afterEach(() => {
    consoleErrorSpy.restore();
  });
  it("should return error code 2 when no exchange.json files are found", async () => {
    const execStub = createMockExec();
    const fsStub = createMockFs();

    setupDirectoryStructure(fsStub, [
      { path: "base", contents: ["api-v1"] },
      { path: "base/api-v1", contents: ["spec.yaml"] },
    ]);

    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base";
    const newApi = "new";
    const flags = { dir: true };

    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(result).to.equal(2);
    expect(consoleErrorSpy.called).to.be.true;
    expect(consoleErrorSpy.args[0][0].message).to.include(
      "No exchange.json file found in leaf directory: base/api-v1"
    );
  });

  it("should return error code 2 when no exchange.json files are found in entire directory tree", async () => {
    const execStub = createMockExec();
    const fsStub = createMockFs();

    setupDirectoryStructure(fsStub, [{ path: "base", contents: [] }]);

    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base";
    const newApi = "new";
    const flags = { dir: true };

    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(result).to.equal(2);
    expect(consoleErrorSpy.called).to.be.true;
    expect(consoleErrorSpy.args[0][0].message).to.include(
      "No exchange.json file found in leaf directory: base. Each API directory must contain an exchange.json file."
    );
  });

  it("should return error code 2 when maximum directory depth is exceeded", async () => {
    const execStub = createMockExec();
    const fsStub = createMockFs();

    // Create very deep directory structure (4 levels deep, exceeding limit of 3)
    const deepStructure: Array<{ path: string; contents: string[] }> = [];
    let currentPath = "base";
    for (let i = 0; i <= 4; i++) {
      deepStructure.push({ path: currentPath, contents: ["nested"] });
      currentPath += "/nested";
    }

    setupDirectoryStructure(fsStub, deepStructure);

    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base";
    const newApi = "new";
    const flags = { dir: true };

    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(result).to.equal(2);
    expect(consoleErrorSpy.called).to.be.true;
    expect(consoleErrorSpy.args[0][0].message).to.include(
      "Maximum directory depth (3) exceeded while searching for exchange.json files in: base/nested/nested/nested/nested"
    );
  });

  it("should throw an error if oasdiff is not installed", async () => {
    const execStub = sinon.stub();
    execStub.callsArgWith(1, new Error("oasdiff not installed"));

    const oasDiff = pq("./oasDiff", {
      child_process: {
        exec: execStub,
      },
    });

    try {
      await oasDiff.checkOasDiffIsInstalled();
      expect.fail("Expected function to throw an error");
    } catch (error) {
      expect(error.message).to.equal(
        "oasdiff is not installed. Install oasdiff according to https://github.com/oasdiff/oasdiff#installation"
      );
    }
  });

  it("should return 2 when oasdiff throws an error", async () => {
    const execStub = createMockExec();
    execStub.onSecondCall().callsArgWith(1, new Error("mock oasdiff error"));

    const fsStub = createMockFs();
    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base";
    const newApi = "new";
    const flags = {};
    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execStub.called).to.be.true;
    expect(result).to.equal(2);
  });

  it("should execute oasdiff command with correct parameters for single file mode", async () => {
    const execStub = createMockExec();
    execStub.onSecondCall().callsArgWith(1, null, "", ""); // diff result

    const fsStub = createMockFs();
    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base.yaml";
    const newApi = "new.yaml";
    const flags = {};
    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execStub.called).to.be.true;
    expect(execStub.args[1][0]).to.equal(
      'oasdiff changelog "base.yaml" "new.yaml"'
    );
    expect(result).to.equal(0);
  });

  it("should execute oasdiff command with correct parameters for directory mode", async () => {
    const execStub = createMockExec();
    execStub.onSecondCall().callsArgWith(1, null, "", ""); // diff result

    const fsStub = createMockFs();
    setupDirectoryStructure(fsStub, [
      { path: "base", contents: ["api-v1"] },
      { path: "base/api-v1", contents: ["exchange.json", "spec.yaml"] },
      { path: "new", contents: ["api-v1"] },
      { path: "new/api-v1", contents: ["exchange.json", "spec.yaml"] },
    ]);

    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base";
    const newApi = "new";
    const flags = { dir: true };
    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execStub.called).to.be.true;
    expect(execStub.args[1][0]).to.equal(
      'oasdiff changelog "base/api-v1/spec.yaml" "new/api-v1/spec.yaml"'
    );
    expect(result).to.equal(0);
  });

  it("should return 1 when oasdiff returns a non-empty string", async () => {
    const execStub = createMockExec();
    execStub.onSecondCall().callsArgWith(1, null, "mock oasdiff change", "");

    const fsStub = createMockFs();
    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base";
    const newApi = "new";
    const flags = {};
    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execStub.called).to.be.true;
    expect(result).to.equal(1);
  });

  it("should run oasdiff in directory mode when the --dir flag is provided", async () => {
    const execStub = createMockExec();
    execStub.onSecondCall().callsArgWith(1, null, "a minor change", "");

    const fsStub = createMockFs();
    setupDirectoryStructure(fsStub, [
      { path: "base", contents: ["api-v1"] },
      { path: "base/api-v1", contents: ["exchange.json", "spec.yaml"] },
      { path: "new", contents: ["api-v1"] },
      { path: "new/api-v1", contents: ["exchange.json", "spec.yaml"] },
    ]);

    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base";
    const newApi = "new";
    const flags = {
      dir: true,
    };
    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execStub.called).to.be.true;
    expect(execStub.args[1][0]).to.equal(
      'oasdiff changelog "base/api-v1/spec.yaml" "new/api-v1/spec.yaml"'
    );
  });

  it("should concatenate results from multiple directories in text format", async () => {
    const execStub = createMockExec();
    execStub.onSecondCall().callsArgWith(1, null, "changes in api-v1", "");
    execStub.onThirdCall().callsArgWith(1, null, "changes in api-v2", "");

    const fsStub = createMockFs();
    setupDirectoryStructure(fsStub, [
      { path: "base", contents: ["api-v1", "api-v2"] },
      { path: "base/api-v1", contents: ["exchange.json", "spec.yaml"] },
      { path: "base/api-v2", contents: ["exchange.json", "spec.yaml"] },
      { path: "new", contents: ["api-v1", "api-v2"] },
      { path: "new/api-v1", contents: ["exchange.json", "spec.yaml"] },
      { path: "new/api-v2", contents: ["exchange.json", "spec.yaml"] },
    ]);

    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base";
    const newApi = "new";
    const flags = {
      "out-file": "output.txt",
      dir: true,
    };

    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(fsStub.writeFile.called).to.be.true;
    const writtenContent = fsStub.writeFile.args[0][1];
    expect(writtenContent).to.include("=== Changes in api-v1 ===");
    expect(writtenContent).to.include("changes in api-v1");
    expect(writtenContent).to.include("=== Changes in api-v2 ===");
    expect(writtenContent).to.include("changes in api-v2");
  });

  it("should concatenate results from multiple directories in JSON format", async () => {
    const execStub = createMockExec();
    execStub
      .onSecondCall()
      .callsArgWith(1, null, '[{"changes": "in api-v1"}]', "");
    execStub
      .onThirdCall()
      .callsArgWith(1, null, '[{"changes": "in api-v2"}]', "");

    const fsStub = createMockFs();
    setupDirectoryStructure(fsStub, [
      { path: "base", contents: ["api-v1", "api-v2"] },
      { path: "base/api-v1", contents: ["exchange.json", "spec.yaml"] },
      { path: "base/api-v2", contents: ["exchange.json", "spec.yaml"] },
      { path: "new", contents: ["api-v1", "api-v2"] },
      { path: "new/api-v1", contents: ["exchange.json", "spec.yaml"] },
      { path: "new/api-v2", contents: ["exchange.json", "spec.yaml"] },
    ]);

    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base";
    const newApi = "new";
    const flags = {
      "out-file": "output.json",
      format: "json",
      dir: true,
    };

    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(fsStub.writeJson.called).to.be.true;
    const writtenContent = fsStub.writeJson.args[0][1];
    expect(writtenContent).to.be.an("array").with.lengthOf(2);
    expect(writtenContent[0]).to.deep.equal({
      directory: "api-v1",
      changes: [{ changes: "in api-v1" }],
    });
    expect(writtenContent[1]).to.deep.equal({
      directory: "api-v2",
      changes: [{ changes: "in api-v2" }],
    });
  });

  it("should report deleted APIs when directories exist in base but not in new", async () => {
    const execStub = createMockExec();

    const fsStub = createMockFs();
    setupDirectoryStructure(fsStub, [
      { path: "base", contents: ["api-v1", "api-v2"] },
      { path: "base/api-v1", contents: ["exchange.json"] },
      { path: "base/api-v2", contents: ["exchange.json"] },
      { path: "new", contents: ["api-v2"] }, // only api-v2
      { path: "new/api-v2", contents: ["exchange.json"] },
    ]);

    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base";
    const newApi = "new";
    const flags = {
      "out-file": "output.txt",
      dir: true,
    };

    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(fsStub.writeFile.called).to.be.true;
    const writtenContent = fsStub.writeFile.args[0][1];
    expect(writtenContent).to.include("======api-v1 API is deleted======");
  });

  it("should report added APIs when directories exist in new but not in base", async () => {
    const execStub = createMockExec();

    const fsStub = createMockFs();
    setupDirectoryStructure(fsStub, [
      { path: "base", contents: ["api-v1"] },
      { path: "base/api-v1", contents: ["exchange.json"] },
      { path: "new", contents: ["api-v1", "api-v2"] },
      { path: "new/api-v1", contents: ["exchange.json"] },
      { path: "new/api-v2", contents: ["exchange.json"] },
    ]);

    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base";
    const newApi = "new";
    const flags = {
      "out-file": "output.txt",
      dir: true,
    };

    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(fsStub.writeFile.called).to.be.true;
    const writtenContent = fsStub.writeFile.args[0][1];
    expect(writtenContent).to.include("======api-v2 API is added======");
  });

  it("should report both added and deleted APIs in the same comparison", async () => {
    const execStub = createMockExec();
    execStub.onSecondCall().callsArgWith(1, null, "changes in api-v2", "");

    const fsStub = createMockFs();
    setupDirectoryStructure(fsStub, [
      { path: "base", contents: ["api-v1", "api-v2"] },
      { path: "base/api-v1", contents: ["exchange.json", "spec.yaml"] },
      { path: "base/api-v2", contents: ["exchange.json", "spec.yaml"] },
      { path: "new", contents: ["api-v2", "api-v3"] },
      { path: "new/api-v2", contents: ["exchange.json", "spec.yaml"] },
      { path: "new/api-v3", contents: ["exchange.json", "spec.yaml"] },
    ]);

    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base";
    const newApi = "new";
    const flags = {
      "out-file": "output.txt",
      dir: true,
    };

    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(fsStub.writeFile.called).to.be.true;
    const writtenContent = fsStub.writeFile.args[0][1];
    expect(writtenContent).to.include("======api-v1 API is deleted======");
    expect(writtenContent).to.include("======api-v3 API is added======");
    expect(writtenContent).to.include("=== Changes in api-v2 ===");
  });

  it("should handle mixed scenarios with changes, additions, and deletions", async () => {
    const execStub = createMockExec();
    execStub.onSecondCall().callsArgWith(1, null, "changes in common-api", "");
    execStub.onThirdCall().callsArgWith(1, null, "", ""); // no changes in stable-api

    const fsStub = createMockFs();
    setupDirectoryStructure(fsStub, [
      { path: "base", contents: ["common-api", "stable-api", "old-api"] },
      { path: "base/common-api", contents: ["exchange.json", "spec.yaml"] },
      { path: "base/stable-api", contents: ["exchange.json", "spec.yaml"] },
      { path: "base/old-api", contents: ["exchange.json", "spec.yaml"] },
      { path: "new", contents: ["common-api", "stable-api", "new-api"] },
      { path: "new/common-api", contents: ["exchange.json", "spec.yaml"] },
      { path: "new/stable-api", contents: ["exchange.json", "spec.yaml"] },
      { path: "new/new-api", contents: ["exchange.json", "spec.yaml"] },
    ]);

    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base";
    const newApi = "new";
    const flags = {
      "out-file": "output.txt",
      dir: true,
    };

    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(fsStub.writeFile.called).to.be.true;
    const writtenContent = fsStub.writeFile.args[0][1];

    // Should show deleted API
    expect(writtenContent).to.include("======old-api API is deleted======");

    // Should show added API
    expect(writtenContent).to.include("======new-api API is added======");

    // Should show changes in common-api
    expect(writtenContent).to.include("=== Changes in common-api ===");
    expect(writtenContent).to.include("changes in common-api");

    // Should NOT show stable-api since it has no changes
    expect(writtenContent).to.not.include("=== Changes in stable-api ===");
  });

  it("should report deleted APIs in JSON format", async () => {
    const execStub = createMockExec();
    // Empty JSON array (no changes in api-v2)
    execStub.onSecondCall().callsArgWith(1, null, "[]", "");

    const fsStub = createMockFs();
    setupDirectoryStructure(fsStub, [
      { path: "base", contents: ["api-v1", "api-v2"] },
      { path: "base/api-v1", contents: ["exchange.json"] },
      { path: "base/api-v2", contents: ["exchange.json"] },
      { path: "new", contents: ["api-v2"] }, // only api-v2
      { path: "new/api-v2", contents: ["exchange.json"] },
    ]);

    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base";
    const newApi = "new";
    const flags = {
      "out-file": "output.json",
      format: "json",
      dir: true,
    };

    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(fsStub.writeJson.called).to.be.true;
    const writtenContent = fsStub.writeJson.args[0][1];
    expect(writtenContent).to.be.an("array").with.lengthOf(1);
    expect(writtenContent[0]).to.deep.equal({
      directory: "api-v1",
      status: "deleted",
      message: "api-v1 API is deleted",
    });
  });

  it("should report added APIs in JSON format", async () => {
    const execStub = createMockExec();
    // Empty JSON array (no changes in api-v1)
    execStub.onSecondCall().callsArgWith(1, null, "[]", "");

    const fsStub = createMockFs();
    setupDirectoryStructure(fsStub, [
      { path: "base", contents: ["api-v1"] },
      { path: "base/api-v1", contents: ["exchange.json"] },
      { path: "new", contents: ["api-v1", "api-v2"] },
      { path: "new/api-v1", contents: ["exchange.json"] },
      { path: "new/api-v2", contents: ["exchange.json"] },
    ]);

    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base";
    const newApi = "new";
    const flags = {
      "out-file": "output.json",
      format: "json",
      dir: true,
    };

    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(fsStub.writeJson.called).to.be.true;
    const writtenContent = fsStub.writeJson.args[0][1];
    expect(writtenContent).to.be.an("array").with.lengthOf(1);
    expect(writtenContent[0]).to.deep.equal({
      directory: "api-v2",
      status: "added",
      message: "api-v2 API is added",
    });
  });

  it("should not include directories with empty changes in JSON format", async () => {
    const execStub = createMockExec();
    execStub
      .onSecondCall()
      .callsArgWith(1, null, '[{"changes": "in api-v1"}]', "");
    execStub.onThirdCall().callsArgWith(1, null, "[]", "");

    const fsStub = createMockFs();
    setupDirectoryStructure(fsStub, [
      { path: "base", contents: ["api-v1", "api-v2"] },
      { path: "base/api-v1", contents: ["exchange.json", "spec.yaml"] },
      { path: "base/api-v2", contents: ["exchange.json", "spec.yaml"] },
      { path: "new", contents: ["api-v1", "api-v2"] },
      { path: "new/api-v1", contents: ["exchange.json", "spec.yaml"] },
      { path: "new/api-v2", contents: ["exchange.json", "spec.yaml"] },
    ]);

    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base";
    const newApi = "new";
    const flags = {
      "out-file": "output.json",
      format: "json",
      dir: true,
    };

    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(fsStub.writeJson.called).to.be.true;
    const writtenContent = fsStub.writeJson.args[0][1];
    expect(writtenContent).to.be.an("array").with.lengthOf(1);
    expect(writtenContent[0]).to.deep.equal({
      directory: "api-v1",
      changes: [{ changes: "in api-v1" }],
    });
  });

  it("should not include empty results in single file JSON mode", async () => {
    const execStub = createMockExec();
    execStub.onSecondCall().callsArgWith(1, null, "[]", "");

    const fsStub = createMockFs();
    const oasDiff = createOasDiffProxy(execStub, fsStub);

    const baseApi = "base.yaml";
    const newApi = "new.yaml";
    const flags = { format: "json" };
    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execStub.called).to.be.true;
    expect(result).to.equal(0);
  });

  it("should include non-empty results in single file JSON mode", async () => {
    const execStub = createMockExec();
    execStub
      .onSecondCall()
      .callsArgWith(1, null, '[{"change": "something"}]', ""); // non-empty array result

    const fsStub = createMockFs();
    const oasDiff = createOasDiffProxy(execStub, fsStub);

    // Arrange
    const baseApi = "base.yaml";
    const newApi = "new.yaml";
    const flags = { format: "json" };
    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execStub.called).to.be.true;
    expect(result).to.equal(1); // Changes should be reported
  });
});
