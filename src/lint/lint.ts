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

// AMF throws custom error objects, but does not provide type definitions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AmfError = Record<string, any>;

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
    // AMF throws a custom object instead of an instance of Error, so we need to
    // clean it up and re-throw it to make it more useful. AMF does not provide
    // any helpful way to access the underlying error (e.g. the ENOENT thrown by
    // fs.readFile), so the easiest way seems to be to convert the AMF error to
    // a string and then work with that string.

    const message = `${err.message ?? err}`;
    if (message.includes("no such file or directory")) {
      throw new Error(`Custom profile ${profileFile} does not exist`);
    } else if (err instanceof Error) {
      // Normal error, don't need to modify to rethrow
      throw err;
    }
    // AMF error, message starts with amf name that we don't care about
    const cleaned = new Error(message.replace(/^amf\S+? /, "")) as Error & {
      amfError: AmfError;
    };
    cleaned.amfError = err;
    throw cleaned;
  }

  return Core.validate(amfModel, profileName, MessageStyles.RAML);
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
