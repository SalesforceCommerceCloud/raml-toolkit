/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { model } from "amf-client-js";

import { resolveApiModel, parseRamlFile, getAllDataTypes } from "../parser";

import { Name } from "./name";
import { ApiTree } from "./apiTree";
import { RestApi } from "../../download/exchangeTypes";
import path from "path";
import fs from "fs-extra";

/**
 * An API represented as an AMF model. Includes the extracted data types
 * defined in the spec. Common transformations of the name are cached for
 * reference in templates and for use in assembling file paths.
 */
export class Api extends ApiTree {
  dataTypes: model.domain.CustomDomainProperty[];
  metadata: RestApi;
  constructor(public model: model.document.Document, filepath: string) {
    super(
      new Name((model.encodes as model.domain.WebApi)?.name.value()),
      filepath,
      undefined
    );
    this.dataTypes = getAllDataTypes(model);
    Object.freeze(this);
  }
}

/**
 * Create a new Api object from a file. This is static and not a constructor
 * because it is async.
 *
 * @param filepath - the path to an API spec file like RAML to be parsed to AMF
 */

export async function createApi(filepath: string): Promise<Api> {
  let entryPoint = "";
  let directory = "";
  if (path.extname(filepath) === ".raml" || path.extname(filepath) === ".rml") {
    entryPoint = filepath;
    directory = path.basename(filepath);
  } else if (fs.existsSync(path.join(filepath, "exchange.json"))) {
    const exchangeConfig = await fs.readJSON(
      path.join(filepath, "exchange.json")
    );

    if (!exchangeConfig["main"]) {
      throw new Error("No entry point defined in the exchange.json");
    }

    entryPoint = path.join(filepath, exchangeConfig["main"]);
    directory = filepath;
  } else {
    throw new Error(
      "No exchange.json or no raml file provided, can't load api"
    );
  }

  return new Api(
    resolveApiModel(await parseRamlFile(entryPoint), "editing"),
    directory
  );
}
