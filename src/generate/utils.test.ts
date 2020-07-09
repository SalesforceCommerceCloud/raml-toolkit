/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { extractTypeFromPayload } from "./utils";

import { model } from "amf-client-js";
import { expect } from "chai";

describe("extractTypeFromPayload", () => {
  let payload: model.domain.Payload;

  beforeEach(() => {
    payload = new model.domain.Payload();
  });

  it("gets schema when name is schema", () => {
    const schema = new model.domain.SchemaShape();
    payload.withSchema(schema);
    payload.schema.withName("schema");
    expect(extractTypeFromPayload(payload)).to.equal("Object");
  });

  it("gets schema from payload when type is Schema", () => {
    const schema = new model.domain.SchemaShape();
    payload.withSchema(schema);
    payload.schema.withName("Foo");
    expect(extractTypeFromPayload(payload)).to.equal("FooT");
  });

  it("gets schema from payload when type is not set and schema anyOf is populated with one type", () => {
    const schema = new model.domain.UnionShape();
    const shape1 = new model.domain.AnyShape();
    shape1.withName("Foo");

    schema.withAnyOf([shape1]);
    payload.withSchema(schema);

    expect(extractTypeFromPayload(payload)).to.equal("FooT");
  });

  it("gets schema from payload when type is not set and schema anyOf is populated with multiple types", () => {
    const schema = new model.domain.UnionShape();
    const shape1 = new model.domain.AnyShape();
    shape1.withName("Foo");

    const shape2 = new model.domain.AnyShape();
    shape2.withName("Baa");

    schema.withAnyOf([shape1, shape2]);
    payload.withSchema(schema);

    expect(extractTypeFromPayload(payload)).to.equal("FooT | BaaT");
  });

  it("fails to get schema when schema is not set", () => {
    expect(() => extractTypeFromPayload(payload)).to.throw();
  });

  it("fails to get schema when payload is null", () => {
    expect(() => extractTypeFromPayload(null)).to.throw();
  });

  it("fails to get schema when payload is undefined", () => {
    expect(() => extractTypeFromPayload(undefined)).to.throw();
  });
});
