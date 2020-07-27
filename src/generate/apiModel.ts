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
} from "../common/parser";

import { Name } from "../common/structures/name";
import { ApiMetadata } from "./apiMetadata";
import { RestApi } from "../download/exchangeTypes";
import path from "path";
import fs from "fs-extra";
import { ramlToolLogger } from "../common/logger";
import _ from "lodash";

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

  constructor(filepath: string) {
    super(path.basename(filepath), filepath, undefined);
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

      if (!exchangeConfig["main"]) {
        throw new Error("No entry point defined in the exchange.json");
      }
      this.main = exchangeConfig["main"];
      this.path = filepath;
    } else {
      throw new Error(
        "No exchange.json or no raml file provided, can't load api"
      );
    }
  }

  // Sometimes the API title differs from the exchange title.
  // The RAML is the source of truth and should take precedence.
  public updateName(): void {
    if (!this.model) {
      throw new Error("Cannot update the name before the model is loaded");
    }
    this.name = new Name(
      (this.model.encodes as model.domain.WebApi)?.name.value()
    );
  }

  public async loadModel(): Promise<void> {
    const tmpModel = await parseRamlFile(path.join(this.path, this.main));

    // The model needs to be cloned because resolveApiModel messes with the dataTypes.
    this.dataTypes = getAllDataTypes(_.cloneDeep(tmpModel));

    this.model = resolveApiModel(tmpModel, "editing");
  }

  public async init(updateName = true): Promise<void> {
    await this.loadModel();
    if (updateName) {
      this.updateName();
    }
    const promises = this.children.map((child) => child.init());
    await Promise.all(promises);
  }

  public async render(): Promise<void> {
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
