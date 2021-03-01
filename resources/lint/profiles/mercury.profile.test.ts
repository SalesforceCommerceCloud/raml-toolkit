/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
"use strict";
import { validateFile } from "../../../src/lint/lint";
import {
  getHappySpec,
  conforms,
  renderSpecAsFile,
} from "../../../testResources/testUtils";

const PROFILE = "mercury";

describe("happy path raml tests", () => {
  it("valid", async () => {
    const doc = getHappySpec();
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);
    conforms(result);
  });
});
