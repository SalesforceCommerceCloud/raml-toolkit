/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
  getTypeFromParameter,
  getTypeFromProperty,
  getPayloadTypeFromRequest,
  getReturnTypeFromOperation
} from "./handlebarsAmfHelpers";
import { ARRAY_DATA_TYPE, OBJECT_DATA_TYPE } from "./utils";
import {
  getInheritedType,
  getLinkedScalarType,
  getLinkedType,
  getObjectType,
  getRequestPayloadModel,
  getScalarType
} from "../../test/generate/handlebarsAmfHelpersTestUtils";

import { model, AMF } from "amf-client-js";
import { expect } from "chai";

describe("HandlebarsAmfHelpers get type helper functions", () => {
  before(() => {
    return AMF.init();
  });

  describe("getTypeFromProperty", () => {
    it("returns 'any' on undefined property", () => {
      expect(getTypeFromProperty(undefined)).to.equal("any");
    });

    it("returns 'any' on null property", () => {
      expect(getTypeFromProperty(null)).to.equal("any");
    });

    it("returns 'boolean' on boolean data type", () => {
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withRange(
        getScalarType("http://www.w3.org/2001/XMLSchema#boolean")
      );

      expect(getTypeFromProperty(property)).to.equal("boolean");
    });

    it("returns 'number' on float data type", () => {
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withRange(
        getScalarType("http://www.w3.org/2001/XMLSchema#float")
      );

      expect(getTypeFromProperty(property)).to.equal("number");
    });

    it("returns 'boolean' on boolean linked data type", () => {
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withRange(
        getLinkedScalarType("http://www.w3.org/2001/XMLSchema#boolean")
      );

      expect(getTypeFromProperty(property)).to.equal("boolean");
    });

    it("returns 'any' on undefined data type", () => {
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withRange(getScalarType(undefined));

      expect(getTypeFromProperty(property)).to.equal("any");
    });

    it("returns 'object' on object data type", () => {
      const property = new model.domain.PropertyShape();
      property.withRange(getObjectType());

      expect(getTypeFromProperty(property)).to.equal("object");
    });

    it("returns 'defined_type' on inherited object type", () => {
      const property = new model.domain.PropertyShape();
      property.withRange(getInheritedType("defined_type"));

      expect(getTypeFromProperty(property)).to.equal("defined_type");
    });

    it("returns 'defined_type' on linked object type", () => {
      const property = new model.domain.PropertyShape();
      property.withRange(getLinkedType("defined_type"));

      expect(getTypeFromProperty(property)).to.equal("defined_type");
    });

    it("returns 'any' on object type that has no details defined", () => {
      const property = new model.domain.PropertyShape();
      property.withRange(new model.domain.AnyShape());

      expect(getTypeFromProperty(property)).to.equal("any");
    });

    it("returns 'Array<string>' on array of strings", () => {
      const range: model.domain.ArrayShape = new model.domain.ArrayShape();
      range.withItems(getScalarType("http://www.w3.org/2001/XMLSchema#string"));

      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withRange(range);

      expect(getTypeFromProperty(property)).to.equal("Array<string>");
    });

    it("returns 'Array<defined_type>' on array of linked object types ", () => {
      const range: model.domain.ArrayShape = new model.domain.ArrayShape();
      range.withItems(getLinkedType("defined_type"));

      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withRange(range);

      expect(getTypeFromProperty(property)).to.equal("Array<defined_type>");
    });

    it("returns 'Array<string>' on array of linked string types ", () => {
      const range: model.domain.ArrayShape = new model.domain.ArrayShape();
      range.withItems(
        getLinkedScalarType("http://www.w3.org/2001/XMLSchema#string")
      );

      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withRange(range);

      expect(getTypeFromProperty(property)).to.equal("Array<string>");
    });

    it("returns 'Array<defined_type>' on array of inherited objected type", () => {
      const inheritedType = new model.domain.ArrayShape();
      inheritedType.withItems(getLinkedType("defined_type"));

      const arrType = new model.domain.ArrayShape();
      arrType.withInherits([inheritedType]);
      const property: model.domain.PropertyShape = new model.domain.PropertyShape();
      property.withRange(arrType);

      expect(getTypeFromProperty(property)).to.equal("Array<defined_type>");
    });

    it("returns 'any' on unhandled type", () => {
      const property = new model.domain.PropertyShape();
      property.withRange(new model.domain.PropertyShape());

      expect(getTypeFromProperty(property)).to.equal("any");
    });
  });

  describe("getTypeFromParameter", () => {
    it("returns 'any' on undefined parameter", () => {
      expect(getTypeFromParameter(undefined)).to.equal("any");
    });

    it("returns 'any' on null parameter", () => {
      expect(getTypeFromParameter(null)).to.equal("any");
    });

    it("returns 'any' on parameter with undefined schema", () => {
      expect(getTypeFromParameter(new model.domain.Parameter())).to.equal(
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

      expect(getTypeFromParameter(param)).to.equal("boolean");
    });
  });

  describe("getReturnTypeFromOperation", () => {
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
      expect(getReturnTypeFromOperation(operation)).to.equal("Object");
    });

    it("returns 'defined_type' on defined_type data type", () => {
      const response: model.domain.Response = operation.responses[0];
      response.withStatusCode("200");
      response.payloads[0].schema.withName("DefinedType");
      expect(getReturnTypeFromOperation(operation)).to.equal("DefinedType");
    });

    it("returns 'void' on defined_type data type, but with statusCode as 500", () => {
      const response: model.domain.Response = operation.responses[0];
      response.withStatusCode("500");
      response.payloads[0].schema.withName("DefinedType");
      expect(getReturnTypeFromOperation(operation)).to.equal("void");
    });

    it("returns 'void' without responses", () => {
      operation.withResponses([]);
      expect(getReturnTypeFromOperation(operation)).to.equal("void");
    });

    it("returns 'void' data type, with response array but with no response codes", () => {
      expect(getReturnTypeFromOperation(operation)).to.equal("void");
    });
  });

  describe("getPayloadTypeFromRequest", () => {
    it("returns 'object' on undefined request model", () => {
      expect(getPayloadTypeFromRequest(undefined)).to.equal(OBJECT_DATA_TYPE);
    });

    it("returns 'object' on null request model", () => {
      expect(getPayloadTypeFromRequest(null)).to.equal(OBJECT_DATA_TYPE);
    });

    it("returns type defined for request payload", () => {
      const typeName = "Type1";
      const shape = new model.domain.NodeShape();
      shape.withName(typeName);
      expect(getPayloadTypeFromRequest(getRequestPayloadModel(shape))).to.equal(
        typeName
      );
    });

    it("returns 'object' when the request payload type name is schema", () => {
      const shape = new model.domain.NodeShape();
      shape.withName("schema");

      expect(getPayloadTypeFromRequest(getRequestPayloadModel(shape))).to.equal(
        OBJECT_DATA_TYPE
      );
    });

    it("returns 'object' when name is undefined", () => {
      const shape = new model.domain.NodeShape();
      expect(getPayloadTypeFromRequest(getRequestPayloadModel(shape))).to.equal(
        OBJECT_DATA_TYPE
      );
    });

    it("returns array type defined for request payload", () => {
      const typeName = "Type1";
      const arrItem = new model.domain.NodeShape();
      arrItem.withName(typeName);

      const shape = new model.domain.ArrayShape();
      shape.withItems(arrItem);

      expect(getPayloadTypeFromRequest(getRequestPayloadModel(shape))).to.equal(
        ARRAY_DATA_TYPE.concat("<")
          .concat(typeName)
          .concat(">")
      );
    });
  });
});
