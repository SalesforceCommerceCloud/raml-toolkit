/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  getResponsesFromPayload,
  getTypeFromPayload,
  getDataType,
  getTypeFromShape,
  getFilteredProperties,
  getValue,
  DEFAULT_DATA_TYPE,
  OBJECT_DATA_TYPE,
} from "./utils";

import { model } from "amf-client-js";

/**
 * Get the baseUri from an AMF model.
 *
 * Note: TypeScript will not allow access to the data without the proper cast to
 * a WebApi type.
 *
 * @param property - A model from the the AMF parser
 *
 * @returns the base URI of the model
 */
export const getBaseUriFromDocument = (
  property: model.document.BaseUnitWithEncodesModel
): string => {
  return property && property.encodes
    ? (property.encodes as model.domain.WebApi).servers[0].url.value()
    : "";
};

/**
 * Check if the specified AMF domain element is a type definition or not.
 *
 * @param domainElement - The domain element to be evaluated
 *
 * @returns true if the domain element is a type definition, false if not
 */
export const isTypeDefinition = (
  domainElement: model.domain.DomainElement
): boolean => {
  return (
    domainElement instanceof model.domain.NodeShape ||
    domainElement instanceof model.domain.ArrayShape
  );
};

/**
 * Check if the specified AMF domain element is an arrayor not.
 *
 * @param domainElement - The domain element to be evaluated
 *
 * @returns true if the domain element is an array, false if not
 */
export const isTypeDefinitionArray = (
  domainElement: model.domain.DomainElement
): boolean => {
  return domainElement instanceof model.domain.ArrayShape;
};

/**
 * Get the return type info of an operation.
 *
 * @param operation - An AMF operation
 *
 * @returns a string for the data type returned by the successful operation
 */
export const getReturnTypeFromOperation = (
  operation: model.domain.Operation
): string => {
  const okResponses = getResponsesFromPayload(operation);
  const dataTypes: string[] = [];

  okResponses.forEach((res) => {
    if (res.payloads.length > 0) {
      dataTypes.push(getTypeFromPayload(res.payloads[0]));
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
 * Get data type of a property.
 *
 * @param property - An AMF property
 *
 * @returns data type, if defined in the property, the default type otherwise
 */
export const getTypeFromProperty = (
  property: model.domain.PropertyShape
): string => {
  if (property != null && property.range != null) {
    return getDataType(property.range);
  }
  return DEFAULT_DATA_TYPE;
};

/**
 * Get data type of a parameter.
 *
 * @param param - An AMF parameter
 *
 * @returns data type, if defined in the parameter, the default type otherwise
 */
export const getTypeFromParameter = (param: model.domain.Parameter): string => {
  if (param != null && param.schema != null) {
    return getDataType(param.schema);
  }
  return DEFAULT_DATA_TYPE;
};

/**
 * Get payload type from the request.
 *
 * @param request - An AMF request
 *
 * @returns Type of the request body
 */
export const getPayloadTypeFromRequest = (
  request: model.domain.Request
): string => {
  if (request?.payloads?.length > 0) {
    const payloadSchema: model.domain.Shape = request.payloads[0].schema;
    return getTypeFromShape(payloadSchema);
  }
  return OBJECT_DATA_TYPE;
};

/**
 * Get all the properties of an AMF node.
 *
 * @param node - An AMF node
 *
 * @returns Array of properties in the node that are not regular expressions
 */
export const getProperties = (
  node: model.domain.NodeShape | undefined | null
): model.domain.PropertyShape[] => {
  return getFilteredProperties(node, (propertyName) => {
    return !/^([/^]).*.$/.test(propertyName);
  });
};

/**
 * Check if the property is defined as required.
 * Required properties have minimum count of at least 1
 * We ignore required additional properties because of the
 * different semantics used in rendering those properties.
 *
 * @param property - An AMF property
 *
 * @returns true if the property is required, false otherwise
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
 * @param property - An AMF property
 *
 * @returns true if the property is optional, false otherwise
 */
export const isOptionalProperty = (
  property: model.domain.PropertyShape
): boolean => {
  return property != null && property.minCount.value() == 0;
};

/**
 * Check if additional properties are allowed for a given AMF node or not.
 *
 * @param node - An AMF node
 *
 * @returns true if additional properties are allowed, false otherwise
 */
export const isAdditionalPropertiesAllowed = (
  node: model.domain.NodeShape
): boolean => {
  return (
    node !== undefined &&
    node.closed !== undefined &&
    node.closed.value !== undefined &&
    !node.closed.value()
  );
};

export { getValue, getDataType };
