/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { handlebarsAmfHelpers as helpers } from "./";

import { verifyProperties } from "../../testResources/generate/handlebarsAmfHelpersTestUtils";

import { model, AMF } from "amf-client-js";
import { expect } from "chai";

describe("HandlebarsAmfHelpers", () => {
  before(() => {
    return AMF.init();
  });

  describe("getBaseUriFromDocument", () => {
    it("returns an empty string for null input", () => {
      expect(helpers.getBaseUriFromDocument(null)).to.equal("");
    });

    it("returns an empty string for empty model", () => {
      expect(
        helpers.getBaseUriFromDocument(new model.document.Document())
      ).to.equal("");
    });

    it("returns correct base uri", async () => {
      const api: model.domain.WebApi = new model.domain.WebApi();
      api.withServer("test-url-value");
      const testModel = new model.document.Document().withEncodes(api);
      expect(helpers.getBaseUriFromDocument(testModel)).to.equal(
        "test-url-value"
      );
    });
  });

  describe("isRequiredProperty", () => {
    it("returns false on undefined property", () => {
      expect(helpers.isRequiredProperty(undefined)).to.be.false;
    });

    it("returns false on null property", () => {
      expect(helpers.isRequiredProperty(null)).to.be.false;
    });

    it("returns false on valid optional properties", () => {
      const property: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      property.withMinCount(0);
      expect(helpers.isRequiredProperty(property)).to.be.false;
    });

    it("returns true on valid required class", () => {
      const property: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      property.withMinCount(1);
      expect(helpers.isRequiredProperty(property)).to.be.true;
    });
  });

  describe("isOptionalProperty", () => {
    it("returns false on undefined class", () => {
      expect(helpers.isOptionalProperty(undefined)).to.be.false;
    });

    it("returns false on null class", () => {
      expect(helpers.isOptionalProperty(undefined)).to.be.false;
    });

    it("returns false on valid required property", () => {
      const property: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      property.withMinCount(1);
      expect(helpers.isOptionalProperty(property)).to.be.false;
    });

    it("returns true on valid optional property", () => {
      const property: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      property.withMinCount(0);
      expect(helpers.isOptionalProperty(property)).to.be.true;
    });
  });

  describe("getProperties", () => {
    it("returns empty array on undefined model", () => {
      expect(helpers.getProperties(undefined)).to.be.empty;
    });

    it("returns empty array on null model", () => {
      expect(helpers.getProperties(null)).to.be.empty;
    });

    it("returns empty array on model containing only additional property", () => {
      const property: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      property.withName("//");
      const typeDto = new model.domain.NodeShape();
      typeDto.withProperties([property]);

      expect(helpers.getProperties(typeDto)).to.be.empty;
    });

    it("returns empty array on model containing only one additional property with regex", () => {
      const property: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      property.withName("/.*/");
      const typeDto = new model.domain.NodeShape();
      typeDto.withProperties([property]);

      expect(helpers.getProperties(typeDto)).to.be.empty;
    });

    it("returns empty array on model containing only one additional property with specific regex", () => {
      const property: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      property.withName("/^c_.+$/?");
      property.withMinCount(1);
      const typeDto = new model.domain.NodeShape();
      typeDto.withProperties([property]);

      expect(helpers.getProperties(typeDto)).to.be.empty;
    });

    it("returns empty array on model containing only one additional property with prefix regex", () => {
      const property: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      property.withName("^c_.+$");
      property.withMinCount(1);
      const typeDto = new model.domain.NodeShape();
      typeDto.withProperties([property]);
      expect(helpers.getProperties(typeDto)).to.be.empty;
    });

    it("returns empty array on model that contains no direct properties and no linked properties", () => {
      const typeDto = new model.domain.NodeShape();
      expect(helpers.getProperties(typeDto)).to.be.empty;
    });

    it("returns an array of required and optional parameters on model with required, optional and additional parameters", () => {
      const property1: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      const property2: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      const property3: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      const property4: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      property1.withName("required");
      property1.withMinCount(1);
      property2.withName("optional");
      property2.withMinCount(0);
      property3.withName("//");
      property4.withName("/.*/");
      const typeDto = new model.domain.NodeShape();
      typeDto.withProperties([property1, property2, property3, property4]);

      verifyProperties([property1, property2], helpers.getProperties(typeDto));
    });

    it("returns an array with inherited parameters", () => {
      const inheritedProp: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      const property: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      inheritedProp.withName("p1");
      inheritedProp.withMinCount(1);
      property.withName("p2");
      property.withMinCount(0);
      const inheritedDto = new model.domain.NodeShape();
      inheritedDto.withProperties([inheritedProp]);
      const typeDto = new model.domain.NodeShape();
      typeDto.withProperties([property]);
      typeDto.withInherits([inheritedDto]);

      verifyProperties(
        [inheritedProp, property],
        helpers.getProperties(typeDto)
      );
    });

    it("returns an array with linked parameters", () => {
      const property1: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      const property2: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      property1.withName("p1");
      property1.withMinCount(1);
      property2.withName("p2");
      property2.withMinCount(0);
      const linkedDto = new model.domain.NodeShape();
      linkedDto.withProperties([property1, property2]);
      const typeDto = new model.domain.NodeShape();
      typeDto.withLinkTarget(linkedDto);

      verifyProperties([property1, property2], helpers.getProperties(typeDto));
    });

    it("returns an array excluding duplicate properties", () => {
      const property1: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      const property2: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      const property3: model.domain.PropertyShape =
        new model.domain.PropertyShape();
      const property4: model.domain.PropertyShape =
        new model.domain.PropertyShape();
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
        helpers.getProperties(typeDto)
      );
    });
  });

  describe("isAdditionalPropertiesAllowed", () => {
    it("returns false on undefined RAML type", () => {
      expect(helpers.isAdditionalPropertiesAllowed(undefined)).to.be.false;
    });

    it("returns false when additional properties are not allowed", () => {
      const typeDto = new model.domain.NodeShape();
      // Closed ensures no Additional properties are allowed for this type
      typeDto.withClosed(true);
      expect(helpers.isAdditionalPropertiesAllowed(typeDto)).to.be.false;
    });

    it("returns true when additional properties are allowed", () => {
      const typeDto = new model.domain.NodeShape();
      // Closed ensures no Additional properties are allowed for this type
      typeDto.withClosed(false);
      expect(helpers.isAdditionalPropertiesAllowed(typeDto)).to.be.true;
    });
  });

  describe("isTypeDefinition", () => {
    it("returns true if shape is NodeShape", () => {
      expect(helpers.isTypeDefinition(new model.domain.NodeShape())).to.be.true;
    });

    it("returns false if shape is null", () => {
      expect(helpers.isTypeDefinition(null)).to.be.false;
    });

    it("returns false if shape is ScalarShape", () => {
      expect(helpers.isTypeDefinition(new model.domain.ScalarShape())).to.be
        .false;
    });

    it("returns false if shape is ArrayShape", () => {
      expect(helpers.isTypeDefinition(new model.domain.ArrayShape())).to.be
        .false;
    });
  });

  describe("isArrayType", () => {
    it("returns false if shape is NodeShape", () => {
      expect(helpers.isArrayType(new model.domain.NodeShape())).to.be.false;
    });

    it("returns false if shape is null", () => {
      expect(helpers.isArrayType(null)).to.be.false;
    });

    it("returns false if shape is ScalarShape", () => {
      expect(helpers.isArrayType(new model.domain.ScalarShape())).to.be.false;
    });

    it("returns true if shape is ArrayShape", () => {
      expect(helpers.isArrayType(new model.domain.ArrayShape())).to.be.true;
    });
  });

  describe("isTraitDefinition", () => {
    it("returns false if shape is not a Trait", () => {
      expect(helpers.isTraitDefinition(new model.domain.NodeShape())).to.be
        .false;
    });

    it("returns false if shape is null", () => {
      expect(helpers.isTraitDefinition(null)).to.be.false;
    });

    it("returns true if shape is ScalarShape", () => {
      expect(helpers.isTraitDefinition(new model.domain.Trait())).to.be.true;
    });
  });

  describe("getMediaTypeFromRequesthelper", () => {
    it("returns the correct media type for a request", () => {
      const payload = new model.domain.Payload().withMediaType(
        "application/json"
      );
      const request = new model.domain.Request().withPayloads([payload]);
      expect(helpers.getMediaTypeFromRequest(request)).to.equal(
        "application/json"
      );
    });
  });

  describe("isRequestWithPayload", () => {
    it("returns true for a request with a payload", () => {
      const request = new model.domain.Request();
      request.withPayload("application/json");
      expect(helpers.isRequestWithPayload(request)).to.be.true;
    });

    it("returns false for a request without a payload", () => {
      const request = new model.domain.Request();
      expect(helpers.isRequestWithPayload(request)).to.be.false;
    });

    it("returns false when request is not given", () => {
      expect(helpers.isRequestWithPayload(undefined)).to.be.false;
    });
  });
});
