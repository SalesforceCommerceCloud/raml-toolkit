/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-undef */
"use strict";
import {
  getHappySpec,
  renderSpecAsFile,
  breaksOnlyOneRule,
  conforms
} from "../utils.test";
import { validateFile } from "../../src/validator";

describe("unique display name validation", () => {
  const PROFILE = "mercury";
  const RULE = "http://a.ml/vocabularies/data#unique-display-name";
  let doc;

  beforeEach(() => {
    doc = getHappySpec();
  });

  it("should pass if all the display names are unique", async () => {
    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    conforms(result);
  });

  it("should fail if duplicate display names exist under an endpoint", async () => {
    doc["/resource"]["/{resourceId}"].get.displayName = "notUnique";
    doc["/resource"]["/{resourceId}"].post.displayName = "notUnique";

    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    breaksOnlyOneRule(result, RULE);
  });

  it("should fail if duplicate display names exist under two different endpoints", async () => {
    doc["/resource"]["/{resourceId}"].get.displayName = "notUnique";
    doc["/resource2"]["/{id}"].get.displayName = "notUnique";

    const result = await validateFile(renderSpecAsFile(doc), PROFILE);

    breaksOnlyOneRule(result, RULE);
  });
});
