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
  it("should execute oasdiff command with correct parameters", async () => {
    const stub = sinon.stub();
    stub.onCall(0).returns("version 1.0.0");
    stub.onCall(1).returns("");

    const oasDiff = pq("./oasDiff", {
      child_process: {
        execSync: stub,
      },
    });

    // Arrange
    const baseApi = "base.yaml";
    const newApi = "new.yaml";
    const flags = {};
    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(stub.called).to.be.true;
    expect(result).to.equal(0);
  });

  it("should return 1 when oasdiff returns a non-empty string", async () => {
    const execSyncStub = sinon.stub();
    execSyncStub.onCall(0).returns("version 1.0.0");
    execSyncStub.onCall(1).returns("mock oasdiff change");

    const oasDiff = pq("./oasDiff", {
      child_process: {
        execSync: execSyncStub,
      },
    });

    // Arrange
    const baseApi = "base.yaml";
    const newApi = "new.yaml";
    const flags = {};
    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execSyncStub.called).to.be.true;
    expect(result).to.equal(1);
  });

  it("should return 2 when oasdiff throws an error", async () => {
    const execSyncStub = sinon.stub();
    execSyncStub.onCall(0).returns("version 1.0.0");
    execSyncStub.onCall(1).throws(new Error("mock oasdiff error"));

    const oasDiff = pq("./oasDiff", {
      child_process: {
        execSync: execSyncStub,
      },
    });

    // Arrange
    const baseApi = "base.yaml";
    const newApi = "new.yaml";
    const flags = {};
    const result = await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execSyncStub.called).to.be.true;
    expect(result).to.equal(2);
  });

  it("should run oasdiff in directory mode when the --dir flag is provided", async () => {
    const execSyncStub = sinon.stub();
    execSyncStub.onCall(0).returns("version 1.0.0");
    execSyncStub.onCall(1).returns("a change");

    const oasDiff = pq("./oasDiff", {
      child_process: {
        execSync: execSyncStub,
      },
    });

    const baseApi = "base.yaml";
    const newApi = "new.yaml";
    const flags = {
      dir: true,
    };
    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);

    expect(execSyncStub.called).to.be.true;
    expect(execSyncStub.args[1][0]).to.equal(
      'oasdiff changelog  --composed "base.yaml/**/*.yaml" "new.yaml/**/*.yaml"'
    );
  });

  it("should save the changes to a file when the --out-file flag is provided", async () => {
    const execSyncStub = sinon.stub();
    execSyncStub.onCall(0).returns("version 1.0.0");
    execSyncStub.onCall(1).returns("a change");
    const fsStub = sinon.stub();

    const oasDiff = pq("./oasDiff", {
      child_process: {
        execSync: execSyncStub,
      },
      "fs-extra": {
        writeFile: fsStub,
      },
    });

    // Arrange
    const baseApi = "base.yaml";
    const newApi = "new.yaml";
    const flags = {
      "out-file": "output.txt",
    };

    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);
    expect(fsStub.called).to.be.true;
  });

  it("should save the changes to a jsonfile when the --out-file flag is provided and format is json", async () => {
    const execSyncStub = sinon.stub();
    execSyncStub.onCall(0).returns("version 1.0.0");
    execSyncStub.onCall(1).returns('{"change": "a change"}');
    const fsStub = sinon.stub();

    const oasDiff = pq("./oasDiff", {
      child_process: {
        execSync: execSyncStub,
      },
      "fs-extra": {
        writeJson: fsStub,
      },
    });

    // Arrange
    const baseApi = "base.yaml";
    const newApi = "new.yaml";
    const flags = {
      "out-file": "output.json",
      format: "json",
    };

    await oasDiff.oasDiffChangelog(baseApi, newApi, flags);
    expect(fsStub.called).to.be.true;
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
