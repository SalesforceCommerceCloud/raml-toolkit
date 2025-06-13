/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

const pq = proxyquire.noCallThru();

describe("oasDiffChangelog", () => {
  it("should execute oasdiff command with correct parameters for single file mode", async () => {
    const execSyncStub = sinon.stub();
    execSyncStub.onCall(0).returns("version 1.0.0"); // version check
    execSyncStub.onCall(1).returns(""); // diff result

    const fsStub = {
      readdir: sinon.stub().returns(["api-v1"]),
      stat: sinon.stub().returns({ isDirectory: () => true }),
    };

    const oasDiff = pq("./oasDiff", {
      child_process: {
        execSync: execSyncStub,
      },
      "fs-extra": fsStub,
    });

    // Arrange
    const baseApi = "base.yaml";
    const newApi = "new.yaml";
    const flags = {};
    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execSyncStub.called).to.be.true;
    expect(execSyncStub.args[1][0]).to.equal('oasdiff changelog  "base.yaml" "new.yaml"');
    expect(result).to.equal(0);
  });

  it("should execute oasdiff command with correct parameters for directory mode", async () => {
    const execSyncStub = sinon.stub();
    execSyncStub.onCall(0).returns("version 1.0.0"); // version check
    execSyncStub.onCall(1).returns(""); // diff result

    const fsStub = {
      readdir: sinon.stub().returns(["api-v1"]),
      stat: sinon.stub().returns({ isDirectory: () => true }),
    };

    const oasDiff = pq("./oasDiff", {
      child_process: {
        execSync: execSyncStub,
      },
      "fs-extra": fsStub,
    });

    // Arrange
    const baseApi = "base";
    const newApi = "new";
    const flags = { dir: true };
    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execSyncStub.called).to.be.true;
    expect(execSyncStub.args[1][0]).to.include('"base/api-v1/**/*.yaml"');
    expect(result).to.equal(0);
  });

  it("should return 1 when oasdiff returns a non-empty string", async () => {
    const execSyncStub = sinon.stub();
    execSyncStub.onCall(0).returns("version 1.0.0");
    execSyncStub.onCall(1).returns("mock oasdiff change");

    const fsStub = {
      readdir: sinon.stub().returns(["api-v1"]),
      stat: sinon.stub().returns({ isDirectory: () => true }),
    };

    const oasDiff = pq("./oasDiff", {
      child_process: {
        execSync: execSyncStub,
      },
      "fs-extra": fsStub,
    });

    const baseApi = "base";
    const newApi = "new";
    const flags = {};
    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execSyncStub.called).to.be.true;
    expect(result).to.equal(1);
  });

  it("should return 2 when oasdiff throws an error", async () => {
    const execSyncStub = sinon.stub();
    execSyncStub.onCall(0).returns("version 1.0.0");
    execSyncStub.onCall(1).throws(new Error("mock oasdiff error"));

    const fsStub = {
      readdir: sinon.stub().returns(["api-v1"]),
      stat: sinon.stub().returns({ isDirectory: () => true }),
    };

    const oasDiff = pq("./oasDiff", {
      child_process: {
        execSync: execSyncStub,
      },
      "fs-extra": fsStub,
    });

    const baseApi = "base";
    const newApi = "new";
    const flags = {};
    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execSyncStub.called).to.be.true;
    expect(result).to.equal(2);
  });

  it("should run oasdiff in directory mode when the --dir flag is provided", async () => {
    const execSyncStub = sinon.stub();
    execSyncStub.onCall(0).returns("version 1.0.0");
    execSyncStub.onCall(1).returns("a change");

    const fsStub = {
      readdir: sinon.stub().returns(["api-v1"]),
      stat: sinon.stub().returns({ isDirectory: () => true }),
    };

    const oasDiff = pq("./oasDiff", {
      child_process: {
        execSync: execSyncStub,
      },
      "fs-extra": fsStub,
    });

    const baseApi = "base";
    const newApi = "new";
    const flags = {
      dir: true,
    };
    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execSyncStub.called).to.be.true;
    expect(execSyncStub.args[1][0]).to.equal(
      'oasdiff changelog  --composed "base/api-v1/**/*.yaml" "new/api-v1/**/*.yaml"'
    );
  });

  it("should concatenate results from multiple directories in text format", async () => {
    const execSyncStub = sinon.stub();
    execSyncStub.onCall(0).returns("version 1.0.0");
    execSyncStub.onCall(1).returns("changes in api-v1");
    execSyncStub.onCall(2).returns("changes in api-v2");

    const fsStub = {
      readdir: sinon.stub().returns(["api-v1", "api-v2"]),
      stat: sinon.stub().returns({ isDirectory: () => true }),
      writeFile: sinon.stub(),
    };

    const oasDiff = pq("./oasDiff", {
      child_process: {
        execSync: execSyncStub,
      },
      "fs-extra": fsStub,
    });

    const baseApi = "base";
    const newApi = "new";
    const flags = {
      "out-file": "output.txt",
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
    const execSyncStub = sinon.stub();
    execSyncStub.onCall(0).returns("version 1.0.0");
    execSyncStub.onCall(1).returns('{"changes": "in api-v1"}');
    execSyncStub.onCall(2).returns('{"changes": "in api-v2"}');

    const fsStub = {
      readdir: sinon.stub().returns(["api-v1", "api-v2"]),
      stat: sinon.stub().returns({ isDirectory: () => true }),
      writeJson: sinon.stub(),
    };

    const oasDiff = pq("./oasDiff", {
      child_process: {
        execSync: execSyncStub,
      },
      "fs-extra": fsStub,
    });

    const baseApi = "base";
    const newApi = "new";
    const flags = {
      "out-file": "output.json",
      format: "json",
    };

    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(fsStub.writeJson.called).to.be.true;
    const writtenContent = fsStub.writeJson.args[0][1];
    expect(writtenContent).to.be.an("array").with.lengthOf(2);
    expect(writtenContent[0]).to.deep.include({
      changes: "in api-v1",
      directory: "api-v1",
    });
    expect(writtenContent[1]).to.deep.include({
      changes: "in api-v2",
      directory: "api-v2",
    });
  });

  it("should skip non-directory entries", async () => {
    const execSyncStub = sinon.stub();
    execSyncStub.onCall(0).returns("version 1.0.0");
    execSyncStub.onCall(1).returns("changes in api-v1");

    const fsStub = {
      readdir: sinon.stub().returns(["api-v1", "not-a-dir.txt"]),
      stat: sinon.stub(),
      writeFile: sinon.stub(),
    };
    // First call for api-v1 returns isDirectory true
    fsStub.stat.onCall(0).returns({ isDirectory: () => true });
    // Second call for not-a-dir.txt returns isDirectory false
    fsStub.stat.onCall(1).returns({ isDirectory: () => false });

    const oasDiff = pq("./oasDiff", {
      child_process: {
        execSync: execSyncStub,
      },
      "fs-extra": fsStub,
    });

    const baseApi = "base";
    const newApi = "new";
    const flags = {};

    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    // Should only call execSync twice (once for version check, once for api-v1)
    expect(execSyncStub.callCount).to.equal(2);
  });

  it("should throw an error if oasdiff is not installed", () => {
    const oasDiff = pq("./oasDiff", {
      child_process: {
        execSync: sinon.stub().throws(new Error("oasdiff not installed")),
      },
    });

    expect(() => oasDiff.checkOasDiffIsInstalled()).to.throw(
      "oasdiff is not installed. Install oasdiff according to https://github.com/oasdiff/oasdiff#installation"
    );
  });
});
