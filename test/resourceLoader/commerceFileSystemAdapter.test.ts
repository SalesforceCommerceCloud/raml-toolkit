/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
"use strict";


import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";
import { CommerceFileSystemAdapter } from "../../src";

before(() => {
  chai.use(chaiAsPromised);
});

describe("File system adapter tests", () => {
  it("Throws error on undefined resource absolute path", () => {
    const fsAdapter = new CommerceFileSystemAdapter();

    return expect(() => fsAdapter.readFileSync(undefined)).to.throw(
      'The "path" argument must be of type string or an instance of Buffer or URL. Received undefined'
    );
  });
});
