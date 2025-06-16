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
    const execStub = sinon.stub();
    // Mock the callback-style exec function
    execStub.callsArgWith(1, null, "", ""); // version check
    execStub.onSecondCall().callsArgWith(1, null, "", ""); // diff result

    const fsStub = {
      readdir: sinon.stub().returns(["api-v1"]),
      stat: sinon.stub().returns({ isDirectory: () => true }),
    };

    const oasDiff = pq("./oasDiff", {
      child_process: {
        exec: execStub,
      },
      "fs-extra": fsStub,
    });

    // Arrange
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
    const execStub = sinon.stub();
    execStub.callsArgWith(1, null, "version 1.0.0", ""); // version check
    execStub.onSecondCall().callsArgWith(1, null, "", ""); // diff result

    const fsStub = {
      readdir: sinon.stub().returns(["api-v1"]),
      stat: sinon.stub().returns({ isDirectory: () => true }),
    };

    const oasDiff = pq("./oasDiff", {
      child_process: {
        exec: execStub,
      },
      "fs-extra": fsStub,
    });

    // Arrange
    const baseApi = "base";
    const newApi = "new";
    const flags = { dir: true };
    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execStub.called).to.be.true;
    expect(execStub.args[1][0]).to.include("base/api-v1/**/*.yaml");
    expect(result).to.equal(0);
  });

  it("should return 1 when oasdiff returns a non-empty string", async () => {
    const execStub = sinon.stub();
    execStub.callsArgWith(1, null, "version 1.0.0", "");
    execStub.onSecondCall().callsArgWith(1, null, "mock oasdiff change", "");

    const fsStub = {
      readdir: sinon.stub().returns(["api-v1"]),
      stat: sinon.stub().returns({ isDirectory: () => true }),
    };

    const oasDiff = pq("./oasDiff", {
      child_process: {
        exec: execStub,
      },
      "fs-extra": fsStub,
    });

    const baseApi = "base";
    const newApi = "new";
    const flags = {};
    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execStub.called).to.be.true;
    expect(result).to.equal(1);
  });

  it("should return 2 when oasdiff throws an error", async () => {
    const execStub = sinon.stub();
    execStub.callsArgWith(1, null, "version 1.0.0", "");
    execStub.onSecondCall().callsArgWith(1, new Error("mock oasdiff error"));

    const fsStub = {
      readdir: sinon.stub().returns(["api-v1"]),
      stat: sinon.stub().returns({ isDirectory: () => true }),
    };

    const oasDiff = pq("./oasDiff", {
      child_process: {
        exec: execStub,
      },
      "fs-extra": fsStub,
    });

    const baseApi = "base";
    const newApi = "new";
    const flags = {};
    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execStub.called).to.be.true;
    expect(result).to.equal(2);
  });

  it("should run oasdiff in directory mode when the --dir flag is provided", async () => {
    const execStub = sinon.stub();
    execStub.callsArgWith(1, null, "version 1.0.0", "");
    execStub.onSecondCall().callsArgWith(1, null, "a minor change", "");

    const fsStub = {
      readdir: sinon.stub().returns(["api-v1"]),
      stat: sinon.stub().returns({ isDirectory: () => true }),
    };

    const oasDiff = pq("./oasDiff", {
      child_process: {
        exec: execStub,
      },
      "fs-extra": fsStub,
    });

    const baseApi = "base";
    const newApi = "new";
    const flags = {
      dir: true,
    };
    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execStub.called).to.be.true;
    expect(execStub.args[1][0]).to.equal(
      'oasdiff changelog --composed "base/api-v1/**/*.yaml" "new/api-v1/**/*.yaml"'
    );
  });

  it("should concatenate results from multiple directories in text format", async () => {
    const execStub = sinon.stub();
    execStub.callsArgWith(1, null, "version 1.0.0", "");
    execStub.onSecondCall().callsArgWith(1, null, "changes in api-v1", "");
    execStub.onThirdCall().callsArgWith(1, null, "changes in api-v2", "");

    const fsStub = {
      readdir: sinon.stub().returns(["api-v1", "api-v2"]),
      stat: sinon.stub().returns({ isDirectory: () => true }),
      writeFile: sinon.stub(),
    };

    const oasDiff = pq("./oasDiff", {
      child_process: {
        exec: execStub,
      },
      "fs-extra": fsStub,
    });

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
    const execStub = sinon.stub();
    execStub.callsArgWith(1, null, "version 1.0.0", "");
    execStub
      .onSecondCall()
      .callsArgWith(1, null, '{"changes": "in api-v1"}', "");
    execStub
      .onThirdCall()
      .callsArgWith(1, null, '{"changes": "in api-v2"}', "");

    const fsStub = {
      readdir: sinon.stub().returns(["api-v1", "api-v2"]),
      stat: sinon.stub().returns({ isDirectory: () => true }),
      writeJson: sinon.stub(),
    };

    const oasDiff = pq("./oasDiff", {
      child_process: {
        exec: execStub,
      },
      "fs-extra": fsStub,
    });

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
    const execStub = sinon.stub();
    execStub.callsArgWith(1, null, "version 1.0.0", "");
    execStub.onSecondCall().callsArgWith(1, null, "changes in api-v1", "");

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
        exec: execStub,
      },
      "fs-extra": fsStub,
    });

    const baseApi = "base";
    const newApi = "new";
    const flags = {};

    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    // Should only call exec twice (once for version check, once for api-v1)
    expect(execStub.callCount).to.equal(2);
  });

  it("should report deleted APIs when directories exist in base but not in new", async () => {
    const execStub = sinon.stub();
    execStub.callsArgWith(1, null, "version 1.0.0", "");

    const fsStub = {
      readdir: sinon.stub(),
      stat: sinon.stub(),
      writeFile: sinon.stub(),
    };

    // Base has api-v1 and api-v2, new only has api-v2
    fsStub.readdir.onCall(0).returns(["api-v1", "api-v2"]); // base directories
    fsStub.readdir.onCall(1).returns(["api-v2"]); // new directories

    // All stat calls return isDirectory true
    fsStub.stat.returns({ isDirectory: () => true });

    const oasDiff = pq("./oasDiff", {
      child_process: {
        exec: execStub,
      },
      "fs-extra": fsStub,
    });

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
    const execStub = sinon.stub();
    execStub.callsArgWith(1, null, "version 1.0.0", "");

    const fsStub = {
      readdir: sinon.stub(),
      stat: sinon.stub(),
      writeFile: sinon.stub(),
    };

    // Base has only api-v1, new has api-v1 and api-v2
    fsStub.readdir.onCall(0).returns(["api-v1"]); // base directories
    fsStub.readdir.onCall(1).returns(["api-v1", "api-v2"]); // new directories

    // All stat calls return isDirectory true
    fsStub.stat.returns({ isDirectory: () => true });

    const oasDiff = pq("./oasDiff", {
      child_process: {
        exec: execStub,
      },
      "fs-extra": fsStub,
    });

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
    const execStub = sinon.stub();
    execStub.callsArgWith(1, null, "version 1.0.0", "");
    execStub.onSecondCall().callsArgWith(1, null, "changes in api-v1", "");

    const fsStub = {
      readdir: sinon.stub(),
      stat: sinon.stub(),
      writeFile: sinon.stub(),
    };

    // Base has api-v1 and api-v2, new has api-v2 and api-v3
    fsStub.readdir.onCall(0).returns(["api-v1", "api-v2"]); // base directories
    fsStub.readdir.onCall(1).returns(["api-v2", "api-v3"]); // new directories

    // All stat calls return isDirectory true
    fsStub.stat.returns({ isDirectory: () => true });

    const oasDiff = pq("./oasDiff", {
      child_process: {
        exec: execStub,
      },
      "fs-extra": fsStub,
    });

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
    const execStub = sinon.stub();
    execStub.callsArgWith(1, null, "version 1.0.0", "");
    execStub.onSecondCall().callsArgWith(1, null, "changes in common-api", "");
    execStub.onThirdCall().callsArgWith(1, null, "", ""); // no changes in stable-api

    const fsStub = {
      readdir: sinon.stub(),
      stat: sinon.stub(),
      writeFile: sinon.stub(),
    };

    // Base: common-api, stable-api, old-api
    // New: common-api, stable-api, new-api
    fsStub.readdir.onCall(0).returns(["common-api", "stable-api", "old-api"]); // base
    fsStub.readdir.onCall(1).returns(["common-api", "stable-api", "new-api"]); // new

    // All stat calls return isDirectory true
    fsStub.stat.returns({ isDirectory: () => true });

    const oasDiff = pq("./oasDiff", {
      child_process: {
        exec: execStub,
      },
      "fs-extra": fsStub,
    });

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
});
