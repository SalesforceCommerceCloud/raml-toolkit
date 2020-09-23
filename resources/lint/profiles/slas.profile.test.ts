/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from "fs-extra";
import yaml from "js-yaml";
import path from "path";
import { expect } from "chai";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadProfile(profile: string): Record<string, any> {
  return yaml.safeLoad(
    fs.readFileSync(path.join(__dirname, `${profile}.raml`), "utf8")
  );
}

describe("SLAS profile", () => {
  it("matches mercury except query parameter case", () => {
    const mercury = loadProfile("mercury");
    const slas = loadProfile("slas");
    const camel = "camelcase-query-parameters";
    const snake = "snakecase-query-parameters";

    const mViolations = new Set<string>(mercury.violation);
    mViolations.delete(camel);
    const sViolations = new Set<string>(slas.violation);
    sViolations.delete(snake);
    expect(sViolations).to.deep.equal(mViolations);

    const mValidations = mercury.validations;
    delete mValidations[camel];
    const sValidations = slas.validations;
    delete sValidations[snake];
    expect(sValidations).to.deep.equal(mValidations);
  });
});
