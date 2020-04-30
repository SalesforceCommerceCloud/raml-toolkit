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

describe("title", () => {
  const PROFILE = "mercury";
  
  describe("name validation", () => {
    let doc;
    const RULE = "http://a.ml/vocabularies/data#title-matches-api-name";
  
    beforeEach(() => {
      doc = getHappySpec();
    });
  
    it("should pass if the title matches the separated and capitalized api name", async () => {
      const result = await validateFile(renderSpecAsFile(doc), PROFILE);
  
      conforms(result);
    });
  
    it("should fail if the title has different words", async () => {
      doc.title = "Test Raml Files";
  
      const result = await validateFile(renderSpecAsFile(doc), PROFILE);
  
      breaksOnlyOneRule(result, RULE);
    });
  
    it("should fail if the title is lowercase", async () => {
      doc.title = "test raml file";
  
      const result = await validateFile(renderSpecAsFile(doc), PROFILE);
  
      breaksOnlyOneRule(result, RULE);
    });
  
    it("should fail if the title has a word with more than one uppercase letters", async () => {
      doc.title = "Test RamL File";
  
      const result = await validateFile(renderSpecAsFile(doc), PROFILE);
  
      breaksOnlyOneRule(result, RULE);
    });
  
    it("should fail if the title has more words than the api name", async () => {
      doc.title = "Test Dummy Raml File";
  
      const result = await validateFile(renderSpecAsFile(doc), PROFILE);
  
      breaksOnlyOneRule(result, RULE);
    });
  
    it("should fail if the title has less words than the api name", async () => {
      doc.title = "Raml File";
  
      const result = await validateFile(renderSpecAsFile(doc), PROFILE);
  
      breaksOnlyOneRule(result, RULE);
    });
  });
  
  describe("existence validation", () => {
    let doc;
    const RULE = "http://a.ml/vocabularies/amf/parser#WebAPI-name-minCount";
  
    beforeEach(() => {
      doc = getHappySpec();
    });
  
    it("should fail if title is missing", async () => {
      delete doc.title;
  
      const result = await validateFile(renderSpecAsFile(doc), PROFILE);
      
      breaksOnlyOneRule(result, RULE);
    });
  });  
});