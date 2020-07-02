/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { model } from "amf-client-js";
import _ from "lodash";

import {
  resolveApiModel,
  parseRamlFile,
  getAllDataTypes
} from "../common/parser";

/**
 * An API represented as an AMF model. Includes the extracted data types
 * defined in the spec. Common transformations of the name are cached for
 * reference in templates and for use in assembling file paths.
 */
export class Api {
  dataTypes: model.domain.CustomDomainProperty[];
  model: model.document.Document;
  name: {
    original: string;
    kebabCase: string;
    lowerCamelCase: string;
    snakeCase: string;
    upperCamelCase: string;
  };
  path: string;

  /**
   * Create a new Api object from a file. This is static and not a constructor
   * because it is async.
   *
   * @param apiSpecFilePath - the path to an API spec file like RAML to be parsed to AMF
   */
  static async read(apiSpecFilePath: string): Promise<Api> {
    const api = new Api();
    api.path = apiSpecFilePath;
    api.model = resolveApiModel(
      await parseRamlFile(apiSpecFilePath),
      "editing"
    );
    api.setName((api.model.encodes as model.domain.WebApi).name.value());
    api.dataTypes = getAllDataTypes(api.model);

    return api;
  }

  setName(name = ""): Api {
    this.name = {
      original: name,
      kebabCase: _.kebabCase(name),
      lowerCamelCase: _.camelCase(name),
      snakeCase: _.snakeCase(name),
      upperCamelCase: _.upperFirst(_.camelCase(name))
    };

    return this;
  }
}
