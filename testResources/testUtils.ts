/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
"use strict";
const assert = require("chai").assert;
import tmp from "tmp";
import fs from "fs";
import yaml from "js-yaml";
import _ from "lodash";
import amf from "amf-client-js";
/**
 * Each test starts with loading a known good template and then tweaking it for
 * the test case. If you make changes to the template, make sure all of the
 * tests pass.
 */

export function getHappySpec(
  filename = `${__dirname}/raml/mercury/mercury.raml`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  return yaml.safeLoad(fs.readFileSync(filename, "utf8"));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderSpecAsFile(doc: any): string {
  const tmpFile = tmp.fileSync({ postfix: ".raml" });
  const content = `#%RAML 1.0\n---\n${yaml.safeDump(doc)}`;
  fs.writeFileSync(tmpFile.name, content);
  return tmpFile.name;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderSpecAsUrl(doc: any): string {
  return `file://${renderSpecAsFile(doc)}`;
}

export function conforms(result: amf.client.validate.ValidationReport): void {
  assert.equal(result.conforms, true, result.toString());
}

export function breaksOnlyOneRule(
  result: amf.client.validate.ValidationReport,
  rule: string
): void {
  assert.equal(result.conforms, false, result.toString());
  assert.equal(result.results.length, 1, result.toString());
  assert.equal(result.results[0].validationId, rule, result.toString());
}

export function breaksTheseRules(
  result: amf.client.validate.ValidationReport,
  rules: string[]
): void {
  assert.equal(result.conforms, false, result.toString());
  assert.sameMembers(
    result.results.map((r) => r.validationId),
    rules,
    result.toString()
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renameKey(obj: any, oldKey: any, newKey: any): any {
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
