/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { model, Raml10Resolver } from "amf-client-js";
import amf from "amf-client-js";
import path from "path";
import _ from "lodash";

import { FatRamlResourceLoader } from "./resourceLoaders";

/**
 * Parses a RAML file to an AMF model.
 *
 * @param filename The path to the RAML file to load
 *
 * @returns an AMF model of the RAML
 */
export async function parseRamlFile(
  filename: string
): Promise<model.document.Document> {
  const fileUri = `file://${path.resolve(filename)}`;

  // We initialize AMF first
  amf.plugins.document.WebApi.register();
  amf.plugins.document.Vocabularies.register();
  amf.plugins.features.AMFValidation.register();

  await amf.Core.init();

  const fatRamlResourceLoader = new FatRamlResourceLoader(
    path.dirname(fileUri)
  );
  const ccEnvironment = amf.client.DefaultEnvironment.apply().addClientLoader(
    fatRamlResourceLoader
  );
  const parser = new amf.Raml10Parser(ccEnvironment);
  let document: model.document.Document;

  try {
    document = (await parser.parseFileAsync(
      fileUri
    )) as model.document.Document;
  } catch (err) {
    // AMF throws a custom object instead of an instance of Error, so we need to
    // clean it up and re-throw it to make it more useful. AMF does not provide
    // any helpful way to access the underlying error (e.g. the ENOENT thrown by
    // fs.readFile), so the easiest way seems to be to convert the AMF error to
    // a string and then work with that string.
    if (err instanceof Error) {
      // Normal error, don't need to modify to rethrow
      throw err;
    }
    const message = `${err.message ?? err}`;
    // AMF error, message starts with amf name that we don't care about
    const cleaned = new Error(message.replace(/^amf\S+? /, "")) as Error & {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      amfError: Record<string, any>;
    };
    cleaned.amfError = err;
    throw cleaned;
  }

  return document;
}

function getDataTypesFromDeclare(
  types: model.domain.DomainElement[],
  existingDataTypes: Set<string>
): model.domain.CustomDomainProperty[] {
  const ret: model.domain.CustomDomainProperty[] = [];
  types.forEach((dataType: model.domain.CustomDomainProperty) => {
    if (
      !existingDataTypes.has(dataType.name.value()) &&
      dataType.name.value() !== "trait"
    ) {
      existingDataTypes.add(dataType.name.value());
      ret.push(dataType);
    }
  });
  return ret;
}

/**
 * Get all the referenced data types
 *
 * @param apiReferences - Array of references
 * @param dataTypes - Array of data types
 * @param existingDataTypes - Set of names of data types, used to de-duplicate the data types
 */
export function getReferenceDataTypes(
  apiReferences: model.document.BaseUnit[],
  dataTypes: model.domain.CustomDomainProperty[],
  existingDataTypes: Set<string>
): void {
  if (apiReferences == null || apiReferences.length == 0) {
    return;
  }
  apiReferences.forEach(
    // reference could actually be BaseUnit or BaseUnitWithDeclaresModel
    (reference: model.document.BaseUnitWithDeclaresModel) => {
      if (reference.declares) {
        dataTypes.push(
          ...getDataTypesFromDeclare(reference.declares, existingDataTypes)
        );
      }
      getReferenceDataTypes(
        reference.references(),
        dataTypes,
        existingDataTypes
      );
    }
  );
}

/**
 * Extract all of the delcared data types from an AMF model.
 *
 * @param api - The model to extract data types from
 *
 * @returns data types from model
 */
export function getAllDataTypes(
  api: model.document.BaseUnitWithDeclaresModel
): model.domain.CustomDomainProperty[] {
  let ret: model.domain.CustomDomainProperty[] = [];
  const dataTypes = new Set<string>();
  const temp: model.domain.CustomDomainProperty[] = getDataTypesFromDeclare(
    api.declares,
    dataTypes
  );
  if (temp != null) {
    ret = temp;
  }
  getReferenceDataTypes(api.references(), ret, dataTypes);
  return ret;
}

/**
 * Resolves the AMF model using the given resolution pipeline
 *
 * @param apiModel - AMF model of the API
 * @param resolutionPipeline - resolution pipeline.
 *
 * @returns AMF model after resolving with the given pipeline
 */
export function resolveApiModel(
  apiModel: model.document.BaseUnit,
  resolutionPipeline: "default" | "editing" | "compatibility"
): model.document.Document {
  /**
   * TODO: core.resolution.pipelines.ResolutionPipeline has all the pipelines defined but is throwing an error when used - "Cannot read property 'pipelines' of undefined".
   *  When this is fixed we should change the type of input param "resolutionPipeline"
   */
  if (apiModel == null) {
    throw new Error("Invalid API model provided to resolve");
  }
  if (resolutionPipeline == null) {
    throw new Error("Invalid resolution pipeline provided to resolve");
  }
  const resolver = new Raml10Resolver();
  return resolver.resolve(
    apiModel,
    resolutionPipeline
  ) as model.document.Document;
}

/**
 * Get normalized name for the file/directory that is created while rendering the templates
 *
 * @param name - File or directory name to normalize
 * @returns a normalized name
 */
export function getNormalizedName(name: string): string {
  if (!name) {
    throw new Error("Invalid name provided to normalize");
  }
  return _.camelCase(name);
}

/**
 * Returns API name from the AMF model in Pascal Case ("Shopper Customers" is returned as "ShopperCustomers")
 *
 * @param apiModel - AMF Model of the API
 * @returns Name of the API
 */
export function getApiName(
  apiModel: model.document.BaseUnitWithEncodesModel
): string {
  const apiName = (apiModel.encodes as model.domain.WebApi).name.value();
  return getNormalizedName(apiName);
}
