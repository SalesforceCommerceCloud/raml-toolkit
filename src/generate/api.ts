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

import Name from "./name";

/**
 * An API represented as an AMF model. Includes the extracted data types
 * defined in the spec. Common transformations of the name are cached for
 * reference in templates and for use in assembling file paths.
 */
export class Api {
  private _dataTypes: model.domain.CustomDomainProperty[] = [];
  private _model = new model.document.Document();
  private _name = new Name();
  private _path = "";

  constructor(amfModel = new model.document.Document(), path = "") {
    this.model = amfModel;
    this._path = path;
  }

  get dataTypes(): model.domain.CustomDomainProperty[] {
    return this._dataTypes;
  }

  get model(): model.document.Document {
    return this._model;
  }

  /**
   * Sets the model field. Additionally automatically extracts the datatypes
   * and names from the model and sets those fields.
   */
  set model(model: model.document.Document) {
    this._model = model;
    this._dataTypes = getAllDataTypes(model);
    this._name = new Name((model.encodes as model.domain.WebApi)?.name.value());
  }

  get name(): Name {
    return this._name;
  }

  get path(): string {
    return this._path;
  }

  /**
   * Create a new Api object from a file. This is static and not a constructor
   * because it is async.
   *
   * @param apiSpecFilePath - the path to an API spec file like RAML to be parsed to AMF
   */
  static async init(apiSpecFilePath: string): Promise<Api> {
    return new Api(
      resolveApiModel(await parseRamlFile(apiSpecFilePath), "editing"),
      apiSpecFilePath
    );
  }
}
