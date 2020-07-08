/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
  getBaseUri,
  getPropertyDataType,
  getReturnPayloadType,
  getParameterDataType,
  getRequestPayloadType,
  getProperties,
  isRequiredProperty,
  isOptionalProperty,
  isAdditionalPropertiesAllowed,
  getValue
} from "./handlebarsHelpers";
import { ARRAY_DATA_TYPE, OBJECT_DATA_TYPE } from "./utils";
import {
  getScalarType,
  getLinkedScalarType,
  getObjectType,
  getLinkedType,
  getInheritedType,
  getRequestPayloadModel,
  verifyProperties
} from "../../test/handlebarsHelpersTestUtils";

import { model, AMF } from "amf-client-js";
import { expect, assert } from "chai";

describe("Handlebars helpers", () => {
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

  describe("getPropertyDataType", () => {
    it("returns 'any' on undefined property", () => {
      expect(getPropertyDataType(undefined)).to.equal("any");
    });

    it("returns 'any' on null property", () => {
      expect(getPropertyDataType(null)).to.equal("any");
    });

    it("returns 'boolean' on boolean data type", () => {
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withRange(
        getScalarType("http://www.w3.org/2001/XMLSchema#boolean")
      );

      expect(getPropertyDataType(property)).to.equal("boolean");
    });

    it("returns 'number' on float data type", () => {
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withRange(
        getScalarType("http://www.w3.org/2001/XMLSchema#float")
      );

      expect(getPropertyDataType(property)).to.equal("number");
    });

    it("returns 'boolean' on boolean linked data type", () => {
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withRange(
        getLinkedScalarType("http://www.w3.org/2001/XMLSchema#boolean")
      );

      expect(getPropertyDataType(property)).to.equal("boolean");
    });

    it("returns 'any' on undefined data type", () => {
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withRange(getScalarType(undefined));

      expect(getPropertyDataType(property)).to.equal("any");
    });

    it("returns 'object' on object data type", () => {
      const property = new model.domain.PropertyShape();
      property.withRange(getObjectType());

      assert.isTrue(getPropertyDataType(property) === "object");
    });

    it("returns 'defined_type' on inherited object type", () => {
      const property = new model.domain.PropertyShape();
      property.withRange(getInheritedType("defined_type"));

      assert.isTrue(getPropertyDataType(property) === "defined_typeT");
    });

    it("returns 'defined_type' on linked object type", () => {
      const property = new model.domain.PropertyShape();
      property.withRange(getLinkedType("defined_type"));

      assert.isTrue(getPropertyDataType(property) === "defined_typeT");
    });

    it("returns 'any' on object type that has no details defined", () => {
      const property = new model.domain.PropertyShape();
      property.withRange(new model.domain.AnyShape());

      expect(getPropertyDataType(property)).to.equal("any");
    });

    it("returns 'Array<string>' on array of strings", () => {
      const range: model.domain.ArrayShape = new model.domain.ArrayShape();
      range.withItems(getScalarType("http://www.w3.org/2001/XMLSchema#string"));

      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withRange(range);

      expect(getPropertyDataType(property)).to.equal("Array<string>");
    });

    it("returns 'Array<defined_type>' on array of linked object types ", () => {
      const range: model.domain.ArrayShape = new model.domain.ArrayShape();
      range.withItems(getLinkedType("defined_type"));

      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withRange(range);

      expect(getPropertyDataType(property)).to.equal("Array<defined_typeT>");
    });

    it("returns 'Array<string>' on array of linked string types ", () => {
      const range: model.domain.ArrayShape = new model.domain.ArrayShape();
      range.withItems(
        getLinkedScalarType("http://www.w3.org/2001/XMLSchema#string")
      );

      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withRange(range);

      expect(getPropertyDataType(property)).to.equal("Array<string>");
    });

    it("returns 'Array<defined_type>' on array of inherited objected type", () => {
      const inheritedType = new model.domain.ArrayShape();
      inheritedType.withItems(getLinkedType("defined_type"));

      const arrType = new model.domain.ArrayShape();
      arrType.withInherits([inheritedType]);
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withRange(arrType);

      expect(getPropertyDataType(property)).to.equal("Array<defined_typeT>");
    });

    it("returns 'any' on unhandled type", () => {
      const property = new model.domain.PropertyShape();
      property.withRange(new model.domain.PropertyShape());

      expect(getPropertyDataType(property)).to.equal("any");
    });
  });

  describe("getParameterDataType", () => {
    it("returns 'any' on undefined parameter", () => {
      expect(getParameterDataType(undefined)).to.equal("any");
    });

    it("returns 'any' on null parameter", () => {
      expect(getParameterDataType(null)).to.equal("any");
    });

    it("returns 'any' on parameter with undefined schema", () => {
      expect(getParameterDataType(new model.domain.Parameter())).to.equal(
        "any"
      );
    });

    /**
     * Note: Test cases to get various data types (arrays, objects, etc) are already covered as part of the property data type tests
     */
    it("returns 'boolean' on boolean data type", () => {
      const param: model.domain.Parameter = new model.domain.Parameter();
      param.withSchema(
        getScalarType("http://www.w3.org/2001/XMLSchema#boolean")
      );

      expect(getParameterDataType(param)).to.equal("boolean");
    });
  });

  describe("getReturnPayloadType", () => {
    const operation: model.domain.Operation = new model.domain.Operation();

    beforeEach(() => {
      const response: model.domain.Response = new model.domain.Response();
      const payload: model.domain.Payload = new model.domain.Payload();
      payload.withSchema(new model.domain.SchemaShape());
      payload.withMediaType("application/json");
      response.withPayloads([payload]);
      operation.withResponses([response]);
    });

    it("returns 'Object' on unknown data type", () => {
      const response = operation.responses[0];
      response.payloads[0].schema.withName("schema");
      response.withStatusCode("200");
      expect(getReturnPayloadType(operation)).to.equal("Object");
    });

    it("returns 'defined_type' on defined_type data type", () => {
      const response: model.domain.Response = operation.responses[0];
      response.withStatusCode("200");
      response.payloads[0].schema.withName("DefinedType");
      expect(getReturnPayloadType(operation)).to.equal("DefinedTypeT");
    });

    it("returns 'void' on defined_type data type, but with statusCode as 500", () => {
      const response: model.domain.Response = operation.responses[0];
      response.withStatusCode("500");
      response.payloads[0].schema.withName("DefinedType");
      expect(getReturnPayloadType(operation)).to.equal("void");
    });

    it("returns 'void' without responses", () => {
      operation.withResponses([]);
      expect(getReturnPayloadType(operation)).to.equal("void");
    });

    it("returns 'void' data type, with response array but with no response codes", () => {
      expect(getReturnPayloadType(operation)).to.equal("void");
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

  describe("getRequestPayloadType", () => {
    it("returns 'object' on undefined request model", () => {
      expect(getRequestPayloadType(undefined)).to.equal(OBJECT_DATA_TYPE);
    });

    it("returns 'object' on null request model", () => {
      expect(getRequestPayloadType(null)).to.equal(OBJECT_DATA_TYPE);
    });

    it("returns type defined for request payload", () => {
      const typeName = "Type1";
      const shape = new model.domain.NodeShape();
      shape.withName(typeName);
      expect(getRequestPayloadType(getRequestPayloadModel(shape))).to.equal(
        typeName + "T"
      );
    });

    it("returns 'object' when the request payload type name is schema", () => {
      const shape = new model.domain.NodeShape();
      shape.withName("schema");

      expect(getRequestPayloadType(getRequestPayloadModel(shape))).to.equal(
        OBJECT_DATA_TYPE
      );
    });

    it("returns 'object' when name is undefined", () => {
      const shape = new model.domain.NodeShape();
      expect(getRequestPayloadType(getRequestPayloadModel(shape))).to.equal(
        OBJECT_DATA_TYPE
      );
    });

    it("returns array type defined for request payload", () => {
      const typeName = "Type1";
      const arrItem = new model.domain.NodeShape();
      arrItem.withName(typeName);

      const shape = new model.domain.ArrayShape();
      shape.withItems(arrItem);

      expect(getRequestPayloadType(getRequestPayloadModel(shape))).to.equal(
        ARRAY_DATA_TYPE.concat("<")
          .concat(typeName)
          .concat("T")
          .concat(">")
      );
    });
  });

  describe("isAdditionalPropertiesAllowed", () => {
    it("returns false on undefined RAML type", () => {
      expect(isAdditionalPropertiesAllowed(undefined)).to.be.false;
    });

    it("returns false on ScalarShape", () => {
      const scalarShape = new model.domain.ScalarShape();
      expect(isAdditionalPropertiesAllowed(scalarShape)).to.be.false;
    });

    it("returns false on objects other than NodeShape", () => {
      expect(isAdditionalPropertiesAllowed({})).to.be.false;
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
});
