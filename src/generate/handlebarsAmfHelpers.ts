/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  getPayloadResponses,
  extractTypeFromPayload,
  getDataType,
  getPayloadType,
  getFilteredProperties,
  DEFAULT_DATA_TYPE,
  ARRAY_DATA_TYPE,
  OBJECT_DATA_TYPE
} from "./utils";

import { model } from "amf-client-js";

/**
 * Selects the baseUri from an AMF model. TypeScript will not allow access to
 * the data without the proper cast to a WebApi type.
 *
 * @param property - A model from the the AMF parser
 *
 * @returns the base URI of the model
 */
export const getBaseUri = (
  property: model.document.BaseUnitWithEncodesModel
): string => {
  return property && property.encodes
    ? (property.encodes as model.domain.WebApi).servers[0].url.value()
    : "";
};

/**
 * Checks the node is a type definition.
 *
 * @param obj - The node to check
 *
 * @returns true if the node is a type definition, false if not
 */
export const isTypeDefinition = (
  cdProperty: model.domain.DomainElement
): boolean => {
  return cdProperty instanceof model.domain.NodeShape;
};

/**
 * Find the return type info for an operation.
 *
 * @param operation - The operation to get the return type for
 *
 * @returns a string for the data type returned by the successful operation
 */
export const getReturnPayloadType = (
  operation: model.domain.Operation
): string => {
  const okResponses = getPayloadResponses(operation);
  const dataTypes: string[] = [];

  okResponses.forEach(res => {
    if (res.payloads.length > 0) {
      dataTypes.push(extractTypeFromPayload(res.payloads[0]));
    } else {
      dataTypes.push("void");
    }
  });

  if (okResponses.length === 0) {
    dataTypes.push("void");
  }

  return dataTypes.join(" | ");
};

/**
 * Get data type of a property
 *
 * @param property - instance of model.domain.PropertyShape
 * @returns data type if defined in the property otherwise returns a default type
 */
export const getPropertyDataType = (
  property: model.domain.PropertyShape
): string => {
  if (property != null && property.range != null) {
    return getDataType(property.range);
  }
  return DEFAULT_DATA_TYPE;
};

/**
 * Get data type of a parameter
 *
 * @param param - instance of model.domain.Parameter
 * @returns data type if defined in the parameter otherwise returns a default type
 */
export const getParameterDataType = (param: model.domain.Parameter): string => {
  if (param != null && param.schema != null) {
    return getDataType(param.schema);
  }
  return DEFAULT_DATA_TYPE;
};

/**
 * Get type of the request body
 *
 * @param request - AMF model of tge request
 * @returns Type of the request body
 */
export const getRequestPayloadType = (
  request: model.domain.Request
): string => {
  if (
    request != null &&
    request.payloads != null &&
    request.payloads.length > 0
  ) {
    const payloadSchema: model.domain.Shape = request.payloads[0].schema;
    if (payloadSchema instanceof model.domain.ArrayShape) {
      return ARRAY_DATA_TYPE.concat("<")
        .concat(getPayloadType(payloadSchema.items))
        .concat(">");
    }
    return getPayloadType(payloadSchema);
  }
  return OBJECT_DATA_TYPE;
};

/**
 * Gets all properties of the DTO
 *
 * @param dtoTypeModel - AMF model of the dto
 * @returns Array of properties in the dto that are not regular expressions
 */
export const getProperties = (
  dtoTypeModel: model.domain.NodeShape | undefined | null
): model.domain.PropertyShape[] => {
  return getFilteredProperties(dtoTypeModel, propertyName => {
    return !/^([/^]).*.$/.test(propertyName);
  });
};

/**
 * Check if the property is defined as required.
 * Required properties have minimum count of at least 1
 * We ignore required additional properties because of the
 * different semantics used in rendering those properties
 *
 * @param property -
 * @returns true if the property is required
 */
export const isRequiredProperty = (
  property: model.domain.PropertyShape
): boolean => {
  return property != null && property.minCount.value() > 0;
};

/**
 * Check if the property is optional.
 * Optional properties have minimum count of 0
 * We ignore optional additional properties which also have minimum count of 0,
 * because of the different semantics used in rendering those properties.
 *
 * @param property -
 * @returns true if the property is optional
 */
export const isOptionalProperty = (
  property: model.domain.PropertyShape
): boolean => {
  return property != null && property.minCount.value() == 0;
};

/**
 * Returns whether additional properties are allowed for a given RAML type.
 *
 * @param ramlTypeDefinition - Any RAML type definition
 * @returns true if additional properties are allowed, false otherwise
 */
export const isAdditionalPropertiesAllowed = (
  ramlTypeDefinition: model.domain.NodeShape
): boolean => {
  return (
    ramlTypeDefinition !== undefined &&
    ramlTypeDefinition.closed !== undefined &&
    ramlTypeDefinition.closed.value !== undefined &&
    !ramlTypeDefinition.closed.value()
  );
};
