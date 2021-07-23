/*
 * Copyright (c) 2021, salesforce.com, inc.
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as unknown as Record<string, any>;
}

describe("SLAS profile", () => {
  it("matches mercury except query parameter case and resource name validation", () => {
    const mercury = loadProfile("mercury");
    const slas = loadProfile("slas");
    const camel = "camelcase-query-parameters";
    const resourceNameValidation = "resource-name-validation";
    const snake = "snakecase-query-parameters";

    const mViolations = new Set<string>(mercury.violation);
    mViolations.delete(camel);
    mViolations.delete(resourceNameValidation);
    const sViolations = new Set<string>(slas.violation);
    sViolations.delete(resourceNameValidation);
    sViolations.delete(snake);
    expect(sViolations).to.deep.equal(mViolations);

    const mValidations = mercury.validations;
    delete mValidations[camel];
    delete mValidations[resourceNameValidation];
    const sValidations = slas.validations;
    delete sValidations[snake];
    delete sValidations[resourceNameValidation];
    expect(sValidations).to.deep.equal(mValidations);
  });
});
