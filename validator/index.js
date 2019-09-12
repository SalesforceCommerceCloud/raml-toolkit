var Promise = require("promise");
var path = require("path");
var amf = require("amf-client-js");

function validateCustom(profileName, profile, model) {
  return new Promise(function(resolve, reject) {
    return amf.Core.loadValidationProfile(profile)
      .then(() => {
        return amf.Core.validate(model, new amf.ProfileName(profileName))
          .then(report => {
            resolve(report);
          })
          .catch(error => {
            console.error(error);
          });
      })
      .catch(reject);
  });
}

async function parseRaml(filename) {
  // We initialize AMF first
  amf.plugins.document.WebApi.register();
  amf.plugins.features.AMFValidation.register();

  return amf.Core.init()
    .then(async () => {
      var parser = new amf.Raml10Parser();

      return parser
        .parseFileAsync(filename)
        .then(function(model) {
          return validateCustom(
            "sdk-ready",
            `file://${path.join(__dirname, "..", "rules", "sdk-ready.raml")}`,
            model
          );
        }) // Validating using a custom profile
        .catch(function(err) {
          console.log("Error validating");
          console.log(err);
        });
    })
    .catch(function(err) {
      console.log(err);
    });
}

module.exports = { parse: parseRaml };
