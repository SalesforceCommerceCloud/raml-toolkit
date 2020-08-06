/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";
import { client, model, Core, MessageStyles, ProfileName } from "amf-client-js";

import { parseRamlFile } from "../common/parser";
import { profilePath } from ".";

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
  const report = await Core.validate(amfModel, profileName, MessageStyles.RAML);
  return report;
}

export async function validateModel(
  model: model.document.BaseUnit,
  profile: string
): Promise<client.validate.ValidationReport> {
  const results = await validateCustom(
    model,
    `file://${path.join(profilePath, `${profile}.raml`)}`
  );

  return results;
}

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

export async function validateFile(
  filename: string,
  profile: string
): Promise<client.validate.ValidationReport> {
  const model = await parseRamlFile(filename);
  if (!model) throw new Error("Error validating file");
  return await validateModel(model, profile);
}
