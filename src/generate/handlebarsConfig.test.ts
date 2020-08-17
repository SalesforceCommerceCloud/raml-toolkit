/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";

import { expect } from "chai";
import { registerPartial, HandlebarsWithAmfHelpers } from "./";

const handlebarTemplate = path.join(
  __dirname,
  "../../testResources/handlebarTemplates/test.hbs"
);

describe("Handlebar config tests", () => {
  it("can use HandlebarsWithAmfHelpers to render a template", () => {
    const template = HandlebarsWithAmfHelpers.compile("{{foo}}");

    expect(template({ foo: "bar" })).to.equal("bar");
  });

  it("can register a partial", () => {
    registerPartial("myPartial", handlebarTemplate);
    const template = HandlebarsWithAmfHelpers.compile("{{> myPartial .}}");

    expect(template({ name: "partial" })).to.equal("partial");
  });

  it("can fails to register a partial when no file exists", () => {
    expect(() => registerPartial("myPartial", "NOT_A_PARTIAL")).to.throw(
      "no such file or directory, open 'NOT_A_PARTIAL"
    );
  });
});
