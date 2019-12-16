/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
var Promise = require("promise");
var path = require("path");
var amf = require("amf-client-js");

function validateCustom(profileName, profile, model) {
  return new Promise(function(resolve, reject) {
    return amf.Core.loadValidationProfile(profile)
      .then(() => {
        return amf.Core.validate(model, new amf.ProfileName(profileName)).then(
          report => {
            resolve(report);
          }
        );
      })
      .catch(reject);
  });
}

async function parseRaml(filename) {
  // We initialize AMF first
  amf.plugins.document.WebApi.register();
  amf.plugins.features.AMFValidation.register();

  return amf.Core.init().then(async () => {
    let parser = amf.Core.parser("RAML 1.0", "application/yaml");

    return parser
      .parseFileAsync(filename)
      .then(function(model) {
        return model;
      }) // Validating using a custom profile
      .catch(function(err) {
        console.log("Error validating");
        console.log(err);
      });
  });
}

async function validateFile(url, profile) {
  let model = await parseRaml(url, profile);

  return validateModel(model, profile);
}

async function validateModel(model, profile) {
  let results = await validateCustom(
    profile,
    `file://${path.join(__dirname, "..", "profiles", `${profile}.raml`)}`,
    model
  );

  return results;
}

module.exports = {
  parse: parseRaml,
  validateFile: validateFile,
  validateModel: validateModel
};
