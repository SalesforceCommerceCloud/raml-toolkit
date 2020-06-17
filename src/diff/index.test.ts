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

import cmd from "../commands/diff";

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
    .it(
      "finds no breaking changes with the default ruleset and exits non-zero"
    );

  test
    .stdout()
    .do(() => cmd.run([ramlOld.name, ramlRemoved.name]))
    .exit(1)
    .it("finds breaking changes with the default ruleset and exits non-zero");
});
