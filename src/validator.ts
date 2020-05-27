/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from "path";
import amf from "amf-client-js";

import { parseRamlFile } from "./parser";

function validateCustom(
  model: amf.model.document.BaseUnit,
  profileFile: string
): Promise<amf.client.validate.ValidationReport> {
  return new Promise(async resolve => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileName: any = await amf.Core.loadValidationProfile(profileFile);
    const report = await amf.Core.validate(
      model,
      profileName,
      amf.MessageStyles.RAML
    );
    resolve(report);
  });
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
  const model = await parseRamlFile(filename);
  if (!model) throw new Error("Error validating file");
  return await validateModel(model, profile);
}
