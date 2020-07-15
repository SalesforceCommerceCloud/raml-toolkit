/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
"use strict";

import { expect, test } from "@oclif/test";
import { writeSync } from "fs";
import { FileResult, fileSync } from "tmp";
import { Rule } from "json-rules-engine";
import chai from "chai";
import chaiFs from "chai-fs";

import cmd from "../commands/diff";
import * as diffDirectories from "./diffDirectories";

chai.use(chaiFs);

const diffDirResult = [
  {
    file: "file.raml",
    diff: [
      {
        id: "#/web-api/endpoints/test-endpoint",
        added: {},
        removed: {}
      }
    ]
  }
];

const createTempFile = (content: string): FileResult => {
  const tempFile = fileSync();
  writeSync(tempFile.fd, content);
  return tempFile;
};

const ramlOld = createTempFile(
  `#%RAML 1.0
---
/resource:
  get:
    displayName: getResource
`
);

const ramlRemoved = createTempFile(
  `#%RAML 1.0
---
/resource:
`
);

const ramlAdded = createTempFile(
  `#%RAML 1.0
---
/resource:
  get:
    displayName: getResource
  post:
    displayName: createResource
`
);

const operationRemovedRule = new Rule(
  `{
    "name": "Rule to detect operation removal",
    "conditions": {
      "all": [
        {
          "fact": "diff",
          "path": "$.type",
          "operator": "contains",
          "value": "apiContract:Operation"
        },
        {
          "fact": "diff",
          "path": "$.added",
          "operator": "hasNoProperty",
          "value": "core:name"
        },
        {
          "fact": "diff",
          "path": "$.removed",
          "operator": "hasProperty",
          "value": "core:name"
        }
      ]
    },
    "event": {
      "type": "operation-removed",
      "params": {
        "category": "Breaking"
      }
    }
  }`
);

const outFile = fileSync({ postfix: ".json" });

const operationRemovedRuleset = createTempFile(
  `[${operationRemovedRule.toJSON()}]`
);

describe("raml-toolkit cli diff command", () => {
  test
    .stdout()
    .do(() => cmd.run(["--version"]))
    .exit(0)
    .it("checks that the version string starts with the app name", ctx => {
      expect(ctx.stdout).to.contain("@commerce-apps/raml-toolkit");
    });

  test
    .stdout()
    .stderr()
    .do(() => cmd.run())
    .exit(2)
    .it("exits non-zero when no files are given");

  test
    .stdout()
    .stderr()
    .do(() => cmd.run([ramlOld.name]))
    .exit(2)
    .it("exits non-zero when only one file is given");

  test
    .stdout()
    .stderr()
    .do(() => cmd.run([ramlOld.name, "this is a bad file path"]))
    .exit(2)
    .it("exits non-zero when second file path is bad");

  test
    .stdout()
    .stderr()
    .do(() => cmd.run(["this is a bad file path", ramlRemoved.name]))
    .exit(2)
    .it("exits non-zero when first file path is bad");

  test
    .stdout()
    .do(() => cmd.run([ramlOld.name, ramlOld.name]))
    .exit(0)
    .it("finds no changes with the default ruleset and exits zero");

  test
    .stdout()
    .do(() => cmd.run([ramlOld.name, ramlAdded.name]))
    .exit(0)
    .it("finds no breaking changes with the default ruleset and exits zero");

  test
    .stdout()
    .do(() => cmd.run([ramlOld.name, ramlRemoved.name]))
    .exit(1)
    .it("finds breaking changes with the default ruleset and exits non-zero");

  test
    .stdout()
    .do(() => cmd.run([ramlOld.name, ramlOld.name, "--diff-only"]))
    .exit(0)
    .it("finds no changes with diff only and exits zero");

  test
    .stdout()
    .do(() => cmd.run([ramlOld.name, ramlAdded.name, "--diff-only"]))
    .exit(1)
    .it("finds added endpoint with diff only and exits non-zero");

  test
    .stdout()
    .do(() => cmd.run([ramlOld.name, ramlRemoved.name, "--diff-only"]))
    .exit(1)
    .it("finds removed endpoint with diff only and exits non-zero");

  test
    .stdout()
    .do(() =>
      cmd.run([
        ramlOld.name,
        ramlOld.name,
        "--ruleset",
        operationRemovedRuleset.name
      ])
    )
    .exit(0)
    .it("finds no changes with custom ruleset and exits zero");

  test
    .stdout()
    .stderr()
    .do(() =>
      cmd.run([
        ramlOld.name,
        ramlAdded.name,
        "--ruleset",
        operationRemovedRuleset.name
      ])
    )
    .exit(0)
    .it("finds no breaking changes with custom ruleset and exits zero");

  test
    .stdout()
    .do(() =>
      cmd.run([
        ramlOld.name,
        ramlRemoved.name,
        "--ruleset",
        operationRemovedRuleset.name
      ])
    )
    .exit(1)
    .it("finds breaking changes with custom ruleset and exits non-zero");

  test
    .stdout()
    .do(() =>
      cmd.run([
        ramlOld.name,
        ramlOld.name,
        "--diff-only",
        "--ruleset",
        operationRemovedRuleset.name
      ])
    )
    .exit(2)
    .it("does not allow ruleset and diff only together, exits non-zero");

  test
    .stdout()
    .do(() => cmd.run([ramlOld.name, ramlOld.name, "--diff-only", "--dir"]))
    .exit(2)
    .it("does not allow diff only and dir together, exits non-zero");

  test
    .stdout()
    .do(() =>
      cmd.run([
        ramlOld.name,
        ramlOld.name,
        "--dir",
        "--ruleset",
        operationRemovedRuleset.name
      ])
    )
    .exit(2)
    .it("does not allow diff only and dir together, exits non-zero");

  test
    .stub(diffDirectories, "diffRamlDirectories", async () => [])
    .stdout()
    .do(() => cmd.run(["oldApis", "newApis", "--dir"]))
    .exit(0)
    .it("finds no changes between directories and exits zero");

  test
    .stub(diffDirectories, "diffRamlDirectories", async () => diffDirResult)
    .stdout()
    .do(() => cmd.run(["oldApis", "newApis", "--dir"]))
    .exit(1)
    .it("finds changes between directories and exits non-zero");

  test
    .stub(diffDirectories, "diffRamlDirectories", async () => [])
    .stdout()
    .do(() => cmd.run(["oldApis", "newApis", "--dir", "-o", outFile.name]))
    .exit(0)
    .it("stores the result in a file when flag is set", () => {
      expect(outFile.name)
        .to.be.a.file()
        .with.content("[]\n");
    });
});
