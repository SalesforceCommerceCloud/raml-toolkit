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

const SPEC_PROFILE_PATH = path.join(__dirname, "raml/mercury/mercury.raml");

const LIBRARY_DIR = `file://${__dirname}/../resources/lint/lib`;

const BASE_CUSTOM_PROFILE = {
  profile: "test_profile",
  uses: {
    "mercury-standards": `${LIBRARY_DIR}/mercury-standards.yaml`,
    "slas-standards": `${LIBRARY_DIR}/slas-standards.yaml`,
  },
  disabled: ["amf-parser.WebAPI-mediaType-datatype"],
};

export function generateValidationRules(
  lib: string,
  rules: string[]
): {
  violation: string[];
  validations: {};
} {
  const myValidations: { [key: string]: string } = {};
  rules.forEach((rule) => (myValidations[rule] = `${lib}.${rule}`));
  return {
    violation: rules,
    validations: myValidations,
  };
}

export function createCustomProfile(rules: {}): string {
  const testProfile = tmp.fileSync({ postfix: ".yaml" });
  fs.writeFileSync(
    testProfile.name,
    "#%Validation Profile 1.0\n" +
      yaml.safeDump(_.merge(BASE_CUSTOM_PROFILE, rules))
  );
  return testProfile.name;
}

/**
 * Each test starts with loading a known good template and then tweaking it for
 * the test case. If you make changes to the template, make sure all of the
 * tests pass.
 */

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
