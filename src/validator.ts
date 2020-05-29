/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";
import amf from "amf-client-js";
import { FatRamlResourceLoader } from "./exchange-connector";

export async function validateCustom(
  model: amf.model.document.BaseUnit,
  profileFile: string
): Promise<amf.client.validate.ValidationReport> {
  let profileName: amf.ProfileName;
  try {
    profileName = await amf.Core.loadValidationProfile(profileFile);
  } catch (err) {
    // We rethrow to provide a cleaner error message
    throw new Error(err.vw);
  }
  const report = await amf.Core.validate(
    model,
    profileName,
    amf.MessageStyles.RAML
  );
  return report;
}

export async function validateModel(
  model: amf.model.document.BaseUnit,
  profile: string
): Promise<amf.client.validate.ValidationReport> {
  const results = await validateCustom(
    model,
    `file://${path.join(__dirname, "..", "profiles", `${profile}.raml`)}`
  );

  return results as amf.client.validate.ValidationReport;
}

export async function parseRaml(
  filename: string
): Promise<amf.model.document.BaseUnit> {
  const fatRamlResourceLoader = new FatRamlResourceLoader(
    path.dirname(filename)
  );
  const ccEnvironment = amf.client.DefaultEnvironment.apply().addClientLoader(
    fatRamlResourceLoader
  );
  const parser = new amf.Raml10Parser(ccEnvironment);

  let model: amf.model.document.BaseUnit;
  try {
    model = await parser.parseFileAsync(filename);
  } catch (err) {
    console.log("Error validating");
    console.log(err);
  }
  return model;
}

export async function printResults(
  results: amf.client.validate.ValidationReport,
  warnings = false
): Promise<void> {
  if (results && !warnings && results.conforms) {
    console.log(`Model: ${results.model}
Profile: ${results.profile}
Conforms? ${results.conforms}
Number of results: 0
Number of hidden warnings: ${results.results.length}
    `);
  } else if (results) {
    console.log(results.toString());
  }
}

export async function validateFile(
  filename: string,
  profile: string
): Promise<amf.client.validate.ValidationReport> {
  // We initialize AMF first
  amf.plugins.document.WebApi.register();
  amf.plugins.document.Vocabularies.register();
  amf.plugins.features.AMFValidation.register();

  await amf.Core.init();

  const model = await parseRaml(`file://${path.resolve(filename)}`);
  if (!model) throw new Error("Error validating file");
  return await validateModel(model, profile);
}
