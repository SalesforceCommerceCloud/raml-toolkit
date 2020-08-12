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
  getAllDataTypes,
} from "../common/amfParser";

import { Name } from "../common/structures/name";
import { RestApi } from "../download/exchangeTypes";
import path from "path";
import fs from "fs-extra";
import { ramlToolLogger } from "../common/logger";
import _ from "lodash";
import { ApiMetadata } from "./";

/**
 * An API represented as an AMF model. Includes the extracted data types
 * defined in the spec. Common transformations of the name are cached for
 * reference in templates and for use in assembling file paths.
 */
export class ApiModel extends ApiMetadata {
  model: model.document.Document;
  dataTypes: model.domain.CustomDomainProperty[] = [];

  metadata: RestApi;
  main: string;
  path: string;
  /**
   *Creates an instance of ApiModel.
   * @param {string} name - Name of the model
   * @param {string} filepath - Root path of the api with an exchange.json OR raml file to read in.
   * @param {ApiMetadata[]} [children=([] = [])] - NYI - Any children that the API might have,
   *    unused, here for consistency with parent
   * @memberof ApiModel
   */
  constructor(name: string, filepath: string, children: ApiMetadata[] = []) {
    super(name, filepath, children);
    if (
      path.extname(filepath) === ".raml" ||
      path.extname(filepath) === ".rml"
    ) {
      this.main = filepath;
      this.path = path.basename(filepath);
    } else if (
      fs.lstatSync(filepath).isDirectory() &&
      fs.existsSync(path.join(filepath, "exchange.json"))
    ) {
      const exchangeConfig = fs.readJSONSync(
        path.join(filepath, "exchange.json")
      );

      this.main = exchangeConfig["main"];
      this.path = filepath;
    } else {
      throw new Error(
        "No exchange.json or no raml file provided, can't load api"
      );
    }
  }
  /**
   * @description - Updates the name identifier of the class if it differs from the one initially provided
   * @memberof ApiModel
   */
  public updateName(): void {
    if (!this.model) {
      throw new Error("Cannot update the name before the model is loaded");
    }
    this.name = new Name(
      (this.model.encodes as model.domain.WebApi)?.name.value()
    );
  }

  /**
   * @description - Load the API model into memory
   * @param {boolean} [updateName=true] - Update the name of the class to the title of the api document
   * @returns {Promise<void>} - An empty promise to ensure completion
   * @memberof ApiModel
   */
  public async loadModel(updateName = true): Promise<void> {
    const tmpModel = await parseRamlFile(path.join(this.path, this.main));

    // The model needs to be cloned because resolveApiModel messes with the dataTypes.
    this.dataTypes = getAllDataTypes(_.cloneDeep(tmpModel));
    this.model = resolveApiModel(tmpModel, "editing");

    if (updateName) {
      this.updateName();
    }
  }

  /**
   * @description Initializes the model since you can't have a constructor return a promise
   * @param {boolean} [updateName=true] - If the filename is different from the model name should we update the name to be the model name?
   * @returns {Promise<void>} - Empty promise to ensure it is finished before returning
   * @memberof ApiModel
   */
  public async init(updateName = true): Promise<void> {
    await this.loadModel(updateName);
    await super.init();
  }

  /**
   * @description - Renders all the templates provided to this class
   * NOTE:  allowProtoPropertiesByDefault and allowProtoMethodsByDefault
   *        are passed due to how AMF models are represented in memory
   *
   * @returns {Promise<void>}
   * @memberof ApiModel
   */
  public async renderThis(): Promise<void> {
    if (!this.model) {
      await this.loadModel();
    }

    ramlToolLogger.info(`Rendering templates for ${this.name.original}`);
    this.templates.forEach((template) => {
      fs.ensureDirSync(path.dirname(template.outputFile));
      fs.writeFileSync(
        template.outputFile,
        template.handlebarTemplate(this, {
          allowProtoPropertiesByDefault: true,
          allowProtoMethodsByDefault: true,
        })
      );
    });
  }
}
