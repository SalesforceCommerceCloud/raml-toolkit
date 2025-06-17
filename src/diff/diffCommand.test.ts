/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
"use strict";

import { expect, test } from "@oclif/test";
import * as fs from "fs-extra";
import { FileResult, fileSync, dirSync, DirResult } from "tmp";
import { Rule } from "json-rules-engine";
import chai from "chai";
import chaiFs from "chai-fs";

import { DiffCommand as cmd } from "./diffCommand";
import * as diffDirectories from "./diffDirectories";
import { NodeChanges } from "./changes/nodeChanges";
import { ApiChanges } from "./changes/apiChanges";
import { ApiCollectionChanges } from "./changes/apiCollectionChanges";
import { ApiDifferencer } from "./apiDifferencer";
import { CategorizedChange } from "./changes/categorizedChange";
import { RuleCategory } from "./ruleCategory";
import * as oasDiff from "./oasDiff";

import proxyquire from "proxyquire";

chai.use(chaiFs);

const nodeChanges = new NodeChanges("test-id", ["test:type"]);
nodeChanges.added = { "core:name": "oldName" };
nodeChanges.removed = { "core:name": "newName" };
nodeChanges.categorizedChanges = [
  new CategorizedChange("Test Rule", "Test Event", RuleCategory.BREAKING, [
    "old",
    "new",
  ]),
];
const apiChanges = new ApiChanges("base/file.raml", "new/file.raml");
apiChanges.nodeChanges = [nodeChanges];
const apiCollectionChanges = new ApiCollectionChanges("baseApis", "newApis");
apiCollectionChanges.changed["file.raml"] = apiChanges;

const createTempFile = (content: string): FileResult => {
  const tempFile = fileSync();
  fs.writeSync(tempFile.fd, content);
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

const oasAdded = createTempFile(
  `
    "openapi": "3.0.0",
    "info": {
      "title": "Test API",
      "version": "1.0.0"
    },
    "paths": {
      "/resource": {
        "get": {
          "summary": "Get resource"
        },
        "post": {
          "summary": "Create resource"
        }
      }
    }
  `
);

const oasOld = createTempFile(
  `
    "openapi": "3.0.0",
    "info": {
      "title": "Test API",
      "version": "1.0.0"
    },
    "paths": {
      "/resource": {
        "get": {
          "summary": "Get resource"
        }
      }
    }
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
        "category": "Breaking",
        "changedProperty": "core:name"
      }
    }
  }`
);

const operationRemovedRuleset = createTempFile(
  `[${operationRemovedRule.toJSON()}]`
);

describe("raml-toolkit cli diff command", () => {
  let baseDir: DirResult;
  let newDir: DirResult;

  before(() => {
    baseDir = dirSync();
    newDir = dirSync();
  });
  test
    .stdout()
    .do(() => cmd.run(["--version"]))
    .exit(0)
    .it("checks that the version string starts with the app name", (ctx) => {
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
    .stub(ApiDifferencer.prototype, "findChanges", async () => {
      throw new Error("test");
    })
    .do(() => cmd.run(["baseSpec", "newSpec", "--diff-only"]))
    .exit(2)
    .it("exits non-zero when there is error while finding file changes");

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
        operationRemovedRuleset.name,
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
        operationRemovedRuleset.name,
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
        operationRemovedRuleset.name,
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
        operationRemovedRuleset.name,
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
        operationRemovedRuleset.name,
      ])
    )
    .exit(2)
    .it("does not allow diff only and dir together, exits non-zero");

  test
    .stdout()
    .stderr()
    .stub(diffDirectories, "diffRamlDirectories", async () => {
      throw new Error("test");
    })
    .do(() => cmd.run([baseDir.name, newDir.name, "--dir"]))
    .exit(2)
    .it("exits non-zero when there is error while finding directory changes");

  test
    .stub(
      diffDirectories,
      "diffRamlDirectories",
      async () => new ApiCollectionChanges("baseApis", "newApis")
    )
    .stdout()
    .do(() => cmd.run([baseDir.name, newDir.name, "--dir"]))
    .exit(0)
    .it("finds no changes between directories and exits zero");

  test
    .stub(
      diffDirectories,
      "diffRamlDirectories",
      async () => apiCollectionChanges
    )
    .stdout()
    .do(() => cmd.run([baseDir.name, newDir.name, "--dir"]))
    .exit(1)
    .it("finds changes between directories and exits non-zero");

  test
    .stub(
      diffDirectories,
      "diffRamlDirectories",
      async () => apiCollectionChanges
    )
    .stdout()
    .add("file", () => fileSync({ postfix: ".json" }))
    .do((ctx) =>
      cmd.run([baseDir.name, newDir.name, "--dir", "-o", ctx.file.name])
    )
    .exit(1)
    .it("stores changes as JSON when file flag is set", (ctx) => {
      expect(ctx.file.name)
        .to.be.a.file()
        .with.content(`${JSON.stringify(apiCollectionChanges)}\n`);
    });

  test
    .stub(ApiDifferencer.prototype, "findChanges", async () => apiChanges)
    .stdout()
    .do(() => cmd.run([ramlOld.name, ramlOld.name, "--log-level=silent"]))
    .exit(1)
    .it("logs changes to console as text when file flag is unset", (ctx) => {
      expect(ctx.stdout).to.equal(
        `${apiChanges.toFormattedString("console")}\n`
      );
    });

  test
    .stub(ApiDifferencer.prototype, "findChanges", async () => apiChanges)
    .stdout()
    .do(() =>
      cmd.run([ramlOld.name, ramlOld.name, "-f", "json", "--log-level=silent"])
    )
    .exit(1)
    .it("logs changes to console as JSON when format flag is set", (ctx) => {
      expect(JSON.parse(ctx.stdout)).to.deep.equal(apiChanges);
    });

  test
    .stub(ApiDifferencer.prototype, "findChanges", async () => apiChanges)
    .stdout()
    .add("file", () => fileSync({ postfix: ".json" }))
    .do((ctx) =>
      cmd.run([
        ramlOld.name,
        ramlOld.name,
        "-f",
        "console",
        "-o",
        ctx.file.name,
      ])
    )
    .exit(1)
    .it("stores changes as text when file and format flags are set", (ctx) => {
      expect(ctx.file.name)
        .to.be.a.file()
        .with.content(apiChanges.toFormattedString("console"));
    });

  test
    .stderr({ print: true })
    .stdout({ print: true })
    .add("file", () => fileSync({ postfix: ".json" }))
    .do((ctx) =>
      cmd.run(["base", "new", "--diff-only", "-f", "json", "-o", ctx.file.name])
    )
    .exit(2)
    .it("does not allow format to be specified for diff only");

  // TODO: The stub does not apply. The actual oasDiffChangelog is called and it will throw
  // an error because we are using test data and not actual oas files
  test
    .stderr({ print: true })
    .stdout({ print: true })
    .stub(oasDiff, "oasDiffChangelog", async () => 0)
    .do(() => {
      cmd.run([oasOld.name, oasAdded.name, "-s", "oas"]);
    })
    .it("invokes oasdiff when spec flag is set to oas");
});
