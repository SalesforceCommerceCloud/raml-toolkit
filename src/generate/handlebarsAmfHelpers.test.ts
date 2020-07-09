/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
  getBaseUri,
  getProperties,
  getValue,
  isAdditionalPropertiesAllowed,
  isOptionalProperty,
  isRequiredProperty,
  isTypeDefinition
} from "./handlebarsAmfHelpers";
import { verifyProperties } from "../../test/generate/handlebarsAmfHelpersTestUtils";

import { model, AMF } from "amf-client-js";
import { expect, assert } from "chai";

describe("HandlebarsAmfHelpers", () => {
  before(() => {
    return AMF.init();
  });

  describe("getBaseUri", () => {
    it("returns an empty string for null input", () => {
      expect(getBaseUri(null)).to.equal("");
    });

    it("returns an empty string for empty model", () => {
      expect(getBaseUri(new model.document.Document())).to.equal("");
    });

    it("returns correct base uri", async () => {
      const api: model.domain.WebApi = new model.domain.WebApi();
      api.withServer("test-url-value");
      const testModel = new model.document.Document().withEncodes(api);
      expect(getBaseUri(testModel)).to.equal("test-url-value");
    });
  });

  describe("getValue", () => {
    it("returns null on undefined name", () => {
      assert.isNull(getValue(undefined));
    });

    it("returns null on undefined value", () => {
      const property: model.domain.ScalarShape = new model.domain.ScalarShape();

      expect(getValue(property.dataType)).to.be.null;
    });

    it("returns 'valid' on valid value", () => {
      const property: model.domain.ScalarShape = new model.domain.ScalarShape();

      property.withDataType("valid");

      expect(getValue(property.dataType)).to.equal("valid");
    });
  });

  describe("isRequiredProperty", () => {
    it("returns false on undefined property", () => {
      expect(isRequiredProperty(undefined)).to.be.false;
    });

    it("returns false on null property", () => {
      expect(isRequiredProperty(null)).to.be.false;
    });

    it("returns false on valid optional properties", () => {
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withMinCount(0);
      expect(isRequiredProperty(property)).to.be.false;
    });

    it("returns true on valid required class", () => {
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withMinCount(1);
      expect(isRequiredProperty(property)).to.be.true;
    });
  });

  describe("isOptionalProperty", () => {
    it("returns false on undefined class", () => {
      expect(isOptionalProperty(undefined)).to.be.false;
    });

    it("returns false on null class", () => {
      expect(isOptionalProperty(undefined)).to.be.false;
    });

    it("returns false on valid required property", () => {
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withMinCount(1);
      expect(isOptionalProperty(property)).to.be.false;
    });

    it("returns true on valid optional property", () => {
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withMinCount(0);
      expect(isOptionalProperty(property)).to.be.true;
    });
  });

  describe("getProperties", () => {
    it("returns empty array on undefined model", () => {
      expect(getProperties(undefined)).to.be.empty;
    });

    it("returns empty array on null model", () => {
      expect(getProperties(null)).to.be.empty;
    });

    it("returns empty array on model containing only additional property", () => {
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withName("//");
      const typeDto = new model.domain.NodeShape();
      typeDto.withProperties([property]);

      expect(getProperties(typeDto)).to.be.empty;
    });

    it("returns empty array on model containing only one additional property with regex", () => {
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withName("/.*/");
      const typeDto = new model.domain.NodeShape();
      typeDto.withProperties([property]);

      expect(getProperties(typeDto)).to.be.empty;
    });

    it("returns empty array on model containing only one additional property with specific regex", () => {
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withName("/^c_.+$/?");
      property.withMinCount(1);
      const typeDto = new model.domain.NodeShape();
      typeDto.withProperties([property]);

      expect(getProperties(typeDto)).to.be.empty;
    });

    it("returns empty array on model containing only one additional property with prefix regex", () => {
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withName("^c_.+$");
      property.withMinCount(1);
      const typeDto = new model.domain.NodeShape();
      typeDto.withProperties([property]);
      expect(getProperties(typeDto)).to.be.empty;
    });

    it("returns empty array on model that contains no direct properties and no linked properties", () => {
      const typeDto = new model.domain.NodeShape();
      expect(getProperties(typeDto)).to.be.empty;
    });

    it("returns an array of required and optional parameters on model with required, optional and additional parameters", () => {
      const property1: model.domain.PropertyShape = new model.domain.PropertyShape();
      const property2: model.domain.PropertyShape = new model.domain.PropertyShape();
      const property3: model.domain.PropertyShape = new model.domain.PropertyShape();
      const property4: model.domain.PropertyShape = new model.domain.PropertyShape();
      property1.withName("required");
      property1.withMinCount(1);
      property2.withName("optional");
      property2.withMinCount(0);
      property3.withName("//");
      property4.withName("/.*/");
      const typeDto = new model.domain.NodeShape();
      typeDto.withProperties([property1, property2, property3, property4]);

      verifyProperties([property1, property2], getProperties(typeDto));
    });

    it("returns an array with inherited parameters", () => {
      const inheritedProp: model.domain.PropertyShape = new model.domain.PropertyShape();
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      inheritedProp.withName("p1");
      inheritedProp.withMinCount(1);
      property.withName("p2");
      property.withMinCount(0);
      const inheritedDto = new model.domain.NodeShape();
      inheritedDto.withProperties([inheritedProp]);
      const typeDto = new model.domain.NodeShape();
      typeDto.withProperties([property]);
      typeDto.withInherits([inheritedDto]);

      verifyProperties([inheritedProp, property], getProperties(typeDto));
    });

    it("returns an array with linked parameters", () => {
      const property1: model.domain.PropertyShape = new model.domain.PropertyShape();
      const property2: model.domain.PropertyShape = new model.domain.PropertyShape();
      property1.withName("p1");
      property1.withMinCount(1);
      property2.withName("p2");
      property2.withMinCount(0);
      const linkedDto = new model.domain.NodeShape();
      linkedDto.withProperties([property1, property2]);
      const typeDto = new model.domain.NodeShape();
      typeDto.withLinkTarget(linkedDto);

      verifyProperties([property1, property2], getProperties(typeDto));
    });

    it("returns an array excluding duplicate properties", () => {
      const property1: model.domain.PropertyShape = new model.domain.PropertyShape();
      const property2: model.domain.PropertyShape = new model.domain.PropertyShape();
      const property3: model.domain.PropertyShape = new model.domain.PropertyShape();
      const property4: model.domain.PropertyShape = new model.domain.PropertyShape();
      property1.withName("p1");
      property1.withMinCount(1);
      property2.withName("duplicate");
      property2.withMinCount(1);
      property3.withName("p2");
      property3.withMinCount(1);
      property4.withName("duplicate");
      property4.withMinCount(1);
      const inheritedDto = new model.domain.NodeShape();
      inheritedDto.withProperties([property1, property2]);
      const typeDto = new model.domain.NodeShape();
      typeDto.withProperties([property3, property4]);
      typeDto.withInherits([inheritedDto]);

      verifyProperties(
        [property3, property4, property1],
        getProperties(typeDto)
      );
    });
  });

  describe("isAdditionalPropertiesAllowed", () => {
    it("returns false on undefined RAML type", () => {
      expect(isAdditionalPropertiesAllowed(undefined)).to.be.false;
    });

    it("returns false when additional properties are not allowed", () => {
      const typeDto = new model.domain.NodeShape();
      // Closed ensures no Additional properties are allowed for this type
      typeDto.withClosed(true);
      expect(isAdditionalPropertiesAllowed(typeDto)).to.be.false;
    });

    it("returns true when additional properties are allowed", () => {
      const typeDto = new model.domain.NodeShape();
      // Closed ensures no Additional properties are allowed for this type
      typeDto.withClosed(false);
      expect(isAdditionalPropertiesAllowed(typeDto)).to.be.true;
    });
  });

  describe("isTypeDefinition", () => {
    it("returns true if shape is NodeShape", () => {
      expect(isTypeDefinition(new model.domain.NodeShape())).to.be.true;
    });

    it("returns true if shape is null", () => {
      expect(isTypeDefinition(null)).to.be.false;
    });

    it("returns false if shape is ScalarShape", () => {
      expect(isTypeDefinition(new model.domain.ScalarShape())).to.be.false;
    });
  });
});
