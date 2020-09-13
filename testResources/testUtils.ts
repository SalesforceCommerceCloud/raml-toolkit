/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";
import tmp from "tmp";
import fs from "fs-extra";
import yaml from "js-yaml";
import _ from "lodash";
import amf from "amf-client-js";
import { expect } from "chai";
import sinon from "sinon";

const VALIDATION_PROFILE_PATH = path.resolve(
  __dirname,
  "../resources/lint/profiles/mercury.raml"
);
const SPEC_PROFILE_PATH = path.join(__dirname, "raml/mercury/mercury.raml");
let lvpStub: sinon.SinonStub;

/**
 * Stubs `Core.loadValidationProfile` so it caches the result for the mercury
 * validation profile. (Behavior is unmodified for other profiles.) This is
 * primarily so that you can edit the file without disrupting tests while
 * they're running (and it also makes the tests slightly faster).
 * IMPORTANT: Multiple files load the profile, so placing it in this helper is
 * the easiest way to ensure that the stub is only created once. However, as a
 * consequence, the cached profile is used for *all* tests, and the method can't
 * be stubbed in other tests in the same suite.
 */
before(async () => {
  await amf.AMF.init();
  const lvp = amf.Core.loadValidationProfile;
  const profilePath = `file://${VALIDATION_PROFILE_PATH}`;
  const profile = await amf.Core.loadValidationProfile(profilePath);
  lvpStub = sinon.stub(amf.Core, "loadValidationProfile");
  // By default, don't modify behavior
  lvpStub.callsFake(lvp);
  // Return the existing profile instead of loading a new one from the same file
  lvpStub.withArgs(profilePath).resolves(profile);
});
after(() => lvpStub.restore());

export function getHappySpec(
  filename = SPEC_PROFILE_PATH
): Record<string, unknown> {
  return yaml.safeLoad(fs.readFileSync(filename, "utf8"));
}

export function renderSpecAsFile(doc: unknown): string {
  const tmpFile = tmp.fileSync({ postfix: ".raml" });
  const content = `#%RAML 1.0\n---\n${yaml.safeDump(doc)}`;
  fs.writeFileSync(tmpFile.name, content);
  return tmpFile.name;
}

export function renderSpecAsUrl(doc: unknown): string {
  return `file://${renderSpecAsFile(doc)}`;
}

export function conforms(result: amf.client.validate.ValidationReport): void {
  expect(result.conforms, `${result}`).to.be.true;
}

export function breaksOnlyOneRule(
  result: amf.client.validate.ValidationReport,
  rule: string
): void {
  expect(result.conforms, `${result}`).to.be.false;
  expect(result.results, `${result}`).to.be.an("array").with.lengthOf(1);
  expect(result.results[0], `${result}`).to.have.property("validationId", rule);
}

export function breaksTheseRules(
  result: amf.client.validate.ValidationReport,
  rules: string[]
): void {
  expect(result.conforms, `${result}`).to.be.false;
  const validationIds = result.results.map((r) => r.validationId);
  expect(validationIds, `${result}`).to.have.members(rules);
}

export function renameKey<T>(obj: T, oldKey: keyof T, newKey: keyof T): T {
  obj[newKey] = _.cloneDeep(obj[oldKey]);
  delete obj[oldKey];
  return obj;
}

export function getSingleValidFile(): string {
  const doc = getHappySpec();
  return renderSpecAsFile(doc);
}

export function getSingleInvalidFile(): string {
  const tmpFile = tmp.fileSync({ postfix: ".raml" }).name;
  fs.writeFileSync(tmpFile, "");
  return tmpFile;
}

export function getSlightlyInvalidFile(): string {
  const doc = getHappySpec();
  doc.version = "v1.1";
  return renderSpecAsFile(doc);
}
