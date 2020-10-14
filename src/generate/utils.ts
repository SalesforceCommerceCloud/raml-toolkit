/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { model } from "amf-client-js";

export const ARRAY_DATA_TYPE = "Array";
export const DEFAULT_DATA_TYPE = "any";
export const OBJECT_DATA_TYPE = "object";
export const PRIMITIVE_DATA_TYPE_MAP = {
  "http://www.w3.org/2001/XMLSchema#string": "string",
  "http://www.w3.org/2001/XMLSchema#integer": "number",
  "http://www.w3.org/2001/XMLSchema#double": "number",
  "http://www.w3.org/2001/XMLSchema#float": "number",
  "http://www.w3.org/2001/XMLSchema#boolean": "boolean",
};

/**
 * Get responses from the given operation object.
 *
 * @param operation - An AMF operation
 *
 * @returns An array of responses extracted from the given operation
 */
export const getResponsesFromPayload = (
  operation: model.domain.Operation
): model.domain.Response[] => {
  const okResponses = [];
  for (const res of operation.responses) {
    if (res.statusCode.nonEmpty && res.statusCode.value().startsWith("2")) {
      okResponses.push(res);
    }
  }
  return okResponses;
};

/**
 * Get types from the given payload.
 *
 * @param payload - Contains schema(s) from which to extract the type(s).
 *
 * @returns string representation of the data types in the payload
 */
export const getTypeFromPayload = (payload: model.domain.Payload): string => {
  if (payload.schema.name.value() === "schema") {
    return "Object";
  }
  if ((payload.schema as model.domain.UnionShape).anyOf !== undefined) {
    const union: string[] = [];
    (payload.schema as model.domain.UnionShape).anyOf.forEach((element) => {
      union.push(element.name.value());
    });
    return union.join(" | ");
  }
  return payload.schema.name.value();
};

/**
 * Get data type for the given namespaced data type.
 *
 * @param nsDataType - A namespaced datatype e.g. http://www.w3.org/2001/XMLSchema#string
 *
 * @returns a regular javascript type
 */
export const getDataTypeFromMap = (nsDataType: string): string => {
  return PRIMITIVE_DATA_TYPE_MAP[nsDataType]
    ? PRIMITIVE_DATA_TYPE_MAP[nsDataType]
    : DEFAULT_DATA_TYPE;
};

/**
 * Get data type from a ScalarShape object.
 *
 * @param scalarShape - A ScalarShape object
 *
 * @returns scalar data type if defined otherwise returns a default type
 */
export const getScalarType = (
  scalarShape: model.domain.ScalarShape
): string => {
  let dataType: string = undefined;
  if (scalarShape.dataType != null) {
    const typeValue = scalarShape.dataType.value();
    if (typeValue != null) {
      dataType = getDataTypeFromMap(typeValue);
    }
  }
  //check if the type is linked to another scalar type
  if (
    dataType == null &&
    scalarShape.isLink === true &&
    scalarShape.linkTarget != null
  ) {
    dataType = getScalarType(
      scalarShape.linkTarget as model.domain.ScalarShape
    );
  }
  if (dataType == null) {
    dataType = DEFAULT_DATA_TYPE;
  }
  return dataType;
};

/**
 * Get data type that is linked/inherited.
 *
 * @param anyShape - instance of model.domain.AnyShape or its subclass
 *
 * @returns linked/inherited data type
 */
export const getLinkedType = (anyShape: model.domain.AnyShape): string => {
  let linkedType: model.domain.DomainElement = undefined;
  let dataType: string = undefined;
  //check if type is inherited
  if (anyShape.inherits != null && anyShape.inherits.length > 0) {
    if (
      anyShape.inherits[0] != null &&
      anyShape.inherits[0].isLink === true &&
      anyShape.inherits[0].linkTarget != null
    ) {
      linkedType = anyShape.inherits[0].linkTarget;
    }
  }
  //check if type is linked
  if (
    linkedType == null &&
    anyShape.isLink === true &&
    anyShape.linkTarget != null
  ) {
    linkedType = anyShape.linkTarget;
  }

  if (
    linkedType != null &&
    linkedType instanceof model.domain.AnyShape &&
    linkedType.name != null
  ) {
    const temp = linkedType.name.value();
    if (temp != null) {
      dataType = temp;
    }
  }
  return dataType;
};

/**
 * Get object type
 *
 * @param anyShape - instance of model.domain.AnyShape or its subclass
 *
 * @returns object type if defined otherwise returns a default type
 */
export const getObjectType = (anyShape: model.domain.AnyShape): string => {
  let dataType: string = getLinkedType(anyShape);
  if (dataType == null) {
    if (
      anyShape instanceof model.domain.NodeShape &&
      anyShape.properties != null
    ) {
      dataType = OBJECT_DATA_TYPE;
    } else {
      dataType = DEFAULT_DATA_TYPE;
    }
  }
  return dataType;
};

/* eslint-disable @typescript-eslint/no-use-before-define */
/**
 * Get data type of an element from AMF model.
 *
 * @param domainElement - An AMF DomainElement or its subclass
 *
 * @returns data type if defined otherwise returns a default type
 */
export const getDataType = (
  domainElement: model.domain.DomainElement
): string => {
  let dataType: string = undefined;
  if (domainElement != null) {
    if (domainElement instanceof model.domain.ScalarShape) {
      dataType = getScalarType(domainElement);
    } else if (domainElement instanceof model.domain.ArrayShape) {
      dataType = getArrayType(domainElement);
    } else if (domainElement instanceof model.domain.AnyShape) {
      dataType = getObjectType(domainElement);
    }
  }
  if (dataType == null) {
    dataType = DEFAULT_DATA_TYPE;
  }
  return dataType;
};

/**
 * Get type of the array.
 *
 * @param arrayShape - An AMF ArrayShape
 *
 * @returns array type if defined otherwise returns a default type
 */
const getArrayType = (arrayShape: model.domain.ArrayShape): string => {
  let arrItem: model.domain.Shape = arrayShape.items;
  if (arrItem == null) {
    if (arrayShape.inherits != null && arrayShape.inherits.length > 0) {
      arrItem = (arrayShape.inherits[0] as model.domain.ArrayShape).items;
    }
  }
  return ARRAY_DATA_TYPE.concat("<").concat(getDataType(arrItem)).concat(">");
};

/**
 * Get type of AMF Shape object.
 *
 * @param shape - An AMF Shape object
 *
 * @returns 'object' if the name property of the Shape is null or 'schema',
 * Array<T> when request payload is of type array,
 * name itself otherwise
 *
 */
export const getTypeFromShape = (shape: model.domain.Shape): string => {
  const name = shape.name.value();
  // If shape is a simple array, the name of the array will be 'default'.
  // In such case we want to return Array<T> with T being the type of the array.
  // If shape is an array but is defined as a data type definition, it will
  // have the name of the data type definition. In such case we want to return
  // the name of the type.
  if (shape instanceof model.domain.ArrayShape && name === "default") {
    return ARRAY_DATA_TYPE.concat("<")
      .concat(shape.items.name.value())
      .concat(">");
  }

  if (!name || name === "schema") {
    return OBJECT_DATA_TYPE;
  }

  return name;
};

/**
 * Get value from an AMF field.
 *
 * @param name - The field to extract the value from
 *
 * @returns The string of the value
 */
export const getValue = <T>(name: model.ValueField<T>): string => {
  let value;
  if (typeof name?.value === "function") {
    value = name.value();
  }
  return value == null ? null : `${value}`;
};

type propertyFilter = (propertyName: string) => boolean;

/**
 * Get properties of a node (inherited and linked) after applying the given filter criteria
 *
 * @param node - An AMF node
 * @param propertyFilter - predicate to be used to filter properties
 *
 * @returns The filtered list of properties
 */
export const getFilteredProperties = (
  node: model.domain.NodeShape | null | undefined,
  propertyFilter: propertyFilter
): model.domain.PropertyShape[] => {
  const properties: model.domain.PropertyShape[] = [];
  const existingProps: Set<string> = new Set();

  while (node != null) {
    if (node.properties != null && node.properties.length > 0) {
      node.properties.forEach((prop) => {
        if (prop != null) {
          const propName = getValue(prop.name);
          //ignore duplicate props
          if (
            propName != null &&
            !existingProps.has(propName) &&
            propertyFilter(propName) === true
          ) {
            existingProps.add(propName);
            properties.push(prop);
          }
        }
      });
      //Check if there are any inherited properties
      if (node.inherits != null && node.inherits.length > 0) {
        node = node.inherits[0] as model.domain.NodeShape;
      } else {
        node = null;
      }
    } else if (node.isLink === true && node.linkTarget != null) {
      //check if other DTO is linked
      node = node.linkTarget as model.domain.NodeShape;
    } else {
      node = null;
    }
  }
  return properties;
};
