/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";
import { client, model, Core, MessageStyles, ProfileName } from "amf-client-js";
import { parseRamlFile } from "../common/amfParser";

export const PROFILE_PATH = path.join(
  __dirname,
  "../../resources/lint/profiles"
);

/**
 * Validate AMF model with the given profile
 * @param amfModel - AMF model
 * @param profileFile - Path to the profile file
 */
export async function validateCustom(
  amfModel: model.document.BaseUnit,
  profileFile: string
): Promise<client.validate.ValidationReport> {
  let profileName: ProfileName;
  try {
    profileName = await Core.loadValidationProfile(profileFile);
  } catch (err) {
    // We rethrow to provide a cleaner error message
    const message: string = err.Yw;
    if (message.includes("no such file or directory")) {
      throw new Error(`Custom profile ${profileFile} does not exist`);
    }
    // An unexpected error was generated, throw a clean version of it.
    throw new Error(message);
  }
  let report: client.validate.ValidationReport;
  try {
    report = await Core.validate(amfModel, profileName, MessageStyles.RAML);
  } catch (err) {
    throw new Error(err.Yw);
  }

  return report;
}

/**
 * Validate AMF model with the given profile
 * @param model - AMF model
 * @param profile - Name of the profile
 */
export async function validateModel(
  model: model.document.BaseUnit,
  profile: string
): Promise<client.validate.ValidationReport> {
  const results = await validateCustom(
    model,
    `file://${path.join(PROFILE_PATH, `${profile}.raml`)}`
  );

  return results;
}

/**
 * Print validation results to console
 * @param results - Validation results
 * @param warnings - True to print warnings
 */
export async function printResults(
  results: client.validate.ValidationReport,
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

/**
 * Validate API specification file with the given profile
 * @param filename - Path to the API specification file
 * @param profile - Name of the profile
 */
export async function validateFile(
  filename: string,
  profile: string
): Promise<client.validate.ValidationReport> {
  const model = await parseRamlFile(filename);
  if (!model) throw new Error("Error validating file");
  return await validateModel(model, profile);
}
