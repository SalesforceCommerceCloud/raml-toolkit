/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";
import amf, { Raml10Parser } from "amf-client-js";

function validateCustom(
  profile: string,
  model: amf.model.document.BaseUnit
): Promise<amf.client.validate.ValidationReport> {
  return new Promise(async (resolve, reject) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileName: any = await amf.Core.loadValidationProfile(profile);
      const report = await amf.Core.validate(
        model,
        profileName,
        amf.MessageStyles.RAML
      );
      resolve(report);
    } catch (reason) {
      return reject(reason);
    }
  });
}

export async function validateModel(
  model: amf.model.document.BaseUnit,
  profile: string
): Promise<amf.client.validate.ValidationReport> {
  const results = await validateCustom(
    `file://${path.join(__dirname, "..", "profiles", `${profile}.raml`)}`,
    model
  );

  return results as amf.client.validate.ValidationReport;
}

export async function parseRaml(
  filename: string
): Promise<amf.model.document.BaseUnit> {
  const parser = new Raml10Parser();

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
  if (results) {
    if (!warnings && results.conforms) {
      console.log(`Model: ${results.model}
  Profile: ${results.profile}
  Conforms? ${results.conforms}
  Number of results: 0
  Number of hidden warnings: ${results.results.length}
      `);
    } else {
      console.log(results.toString());
    }
  }

  if (!results || results.conforms === false) {
    throw new Error(`${results.model} is invalid`);
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

  let results: amf.client.validate.ValidationReport;

  try {
    results = await validateModel(model, profile);
  } catch (err) {
    console.error("Error validating file: " + err);
  }

  return results;
}
