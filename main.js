const path = require("path");
const { Command, flags } = require("@oclif/command");
const validator = require("./validator");

class SfccRamlintCommand extends Command {
  async run() {
    const { argv } = this.parse(SfccRamlintCommand);

    if (argv.length === 0) {
      this.error("Requires at least one file to validate", { exit: 1 });
    }

    await Promise.all(argv.map(this.validateFile)).catch(e => {
      this.error(e.message, { exit: 1 });
    });
  }

  async validateFile(filename) {
    let results = await validator.parse(
      new URL(`file://${path.resolve(filename)}`)
    );
    console.log(results.toString());

    if (!(results && results.conforms === true)) {
      throw new Error(`${filename} is invalid`);
    }
  }
}

SfccRamlintCommand.description = `A linting tool for raml for commerce cloud and beyond

FILENAME is one or more RAML files to lint.
`;

SfccRamlintCommand.flags = {
  // Add --version flag to show CLI version
  version: flags.version({ char: "v" }),
  // Add --help flag to show CLI version
  help: flags.help({ char: "h" })
};

SfccRamlintCommand.args = [{ name: "filename" }];
// This allows a variable length list of files
SfccRamlintCommand.strict = false;

module.exports = SfccRamlintCommand;
