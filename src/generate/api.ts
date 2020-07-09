/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { model } from "amf-client-js";

import {
  resolveApiModel,
  parseRamlFile,
  getAllDataTypes
} from "../common/parser";

import { Name } from "./name";

/**
 * An API represented as an AMF model. Includes the extracted data types
 * defined in the spec. Common transformations of the name are cached for
 * reference in templates and for use in assembling file paths.
 */
export class Api {
  dataTypes: model.domain.CustomDomainProperty[];
  group: string;
  model: model.document.Document;
  name: Name;
  path: string;

  constructor(model, group = "", path = "") {
    this.dataTypes = getAllDataTypes(model);
    this.group = group;
    this.model = model;
    this.name = new Name((model.encodes as model.domain.WebApi)?.name.value());
    this.path = path;
    Object.freeze(this);
  }

  /**
   * Create a new Api object from a file. This is static and not a constructor
   * because it is async.
   *
   * @param apiSpecFilePath - the path to an API spec file like RAML to be parsed to AMF
   * @param group - if the API is part of a group, the name of that group
   */
  static async init(apiSpecFilePath: string, group = ""): Promise<Api> {
    return new Api(
      resolveApiModel(await parseRamlFile(apiSpecFilePath), "editing"),
      group,
      apiSpecFilePath
    );
  }
}
