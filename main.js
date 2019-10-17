const path = require("path");
const fs = require("fs");
const { Command, flags } = require("@oclif/command");
const validator = require("./validator");

class SfccRamlintCommand extends Command {
  async run() {
    const { argv, flags } = this.parse(SfccRamlintCommand);

    if (argv.length === 0) {
      this.error("Requires at least one file to validate", { exit: 1 });
    }

    let exitCode = 0;

    let promises = [];

    for (let arg of argv) {
      // eslint-disable-next-line no-await-in-loop
      promises.push(validateFile(arg, flags.profile, flags.warnings));
    }

    await Promise.all(promises).catch(e => {
      console.error(e.message);
      exitCode += 1;
    });

    if (exitCode !== 0) {
      this.error(`Validation for ${exitCode} file(s) failed.`, {
        exit: exitCode
      });
    }
  }
}

async function validateFile(filename, profile, warnings) {
  let results = await validator.parse(
    `file://${path.resolve(filename)}`,
    profile
  );

  if (warnings && results.conforms) {
    console.log(`Model: ${results.model}
Profile: ${results.profile}
Conforms? ${results.conforms}
Number of results: 0
Number of hidden warnings: ${results.results.length}
    `);
  } else {
    console.log(results.toString());
  }
  if (!(results && results.conforms === true)) {
    throw new Error(`${filename} is invalid`);
  }
}

function getProfiles() {
  let files = fs.readdirSync(path.join(__dirname, "profiles"));
  return files.map(name => name.replace(/\.raml$/i, ""));
}

SfccRamlintCommand.description = `A linting tool for raml for commerce cloud and beyond

FILENAME is one or more RAML files to lint.
`;

SfccRamlintCommand.flags = {
  // Add --profile flag to set the custom profile
  profile: flags.enum({
    char: "p",
    options: getProfiles(),
    default: "sdk-ready",
    description: "profile you want to apply"
  }),
  // Add --warnings flag to set the custom profile
  warnings: flags.boolean({
    char: "w",
    default: false,
    description: "Show all the warnings"
  }),
  // Add --version flag to show CLI version
  version: flags.version({ char: "v" }),
  // Add --help flag to show CLI version
  help: flags.help({ char: "h" })
};

SfccRamlintCommand.args = [{ name: "filename" }];
// This allows a variable length list of files
SfccRamlintCommand.strict = false;

module.exports = { SfccRamlintCommand, parseFile: validator.parse };
