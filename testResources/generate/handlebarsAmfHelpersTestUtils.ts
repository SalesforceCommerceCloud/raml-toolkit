/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
"use strict";
import { expect } from "chai";
import { model } from "amf-client-js";

export const getScalarType = (typeName: string): model.domain.ScalarShape => {
  const scalarType: model.domain.ScalarShape = new model.domain.ScalarShape();
  scalarType.withDataType(typeName);

  return scalarType;
};

export const getLinkedScalarType = (
  typeName: string
): model.domain.AnyShape => {
  const rangeLink = getScalarType(typeName);

  const range = new model.domain.ScalarShape();
  range.withLinkTarget(rangeLink);

  return range;
};

export const getLinkedType = (typeName: string): model.domain.AnyShape => {
  const linkedType = new model.domain.NodeShape();
  linkedType.withName(typeName);

  const shape = new model.domain.AnyShape();
  shape.withLinkTarget(linkedType);

  return shape;
};

export const getInheritedType = (typeName: string): model.domain.AnyShape => {
  const nodeShape = new model.domain.AnyShape();
  nodeShape.withInherits([getLinkedType(typeName)]);

  return nodeShape;
};

export const getObjectType = (): model.domain.NodeShape => {
  const objProperty: model.domain.PropertyShape = new model.domain.PropertyShape();
  objProperty.withName("test");

  const objType = new model.domain.NodeShape();
  objType.withProperties([objProperty]);

  return objType;
};

/**
 * Compare two property lists and throw if they don't.
 *
 * @param expectedProps - The expected property list
 * @param actualProps - The actual property list
 */
export const verifyProperties = (
  expectedProps: model.domain.PropertyShape[],
  actualProps: model.domain.PropertyShape[]
): void => {
  expect(actualProps).to.be.length(expectedProps.length);
  const expectedPropNames: Set<string> = new Set();
  expectedProps.forEach((prop) => {
    expectedPropNames.add(prop.name.value());
  });
  actualProps.forEach((prop) => {
    expect(expectedPropNames.has(prop.name.value())).to.be.true;
  });
};

export const getRequestPayloadModel = (
  shape: model.domain.Shape
): model.domain.Request => {
  const payload = new model.domain.Payload();
  payload.withSchema(shape);

  const reqBody = new model.domain.Request();
  reqBody.withPayloads([payload]);

  return reqBody;
};
