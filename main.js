const { Command, flags } = require("@oclif/command");
const validator = require("./validator");

class SfccRamlintCommand extends Command {
  async run() {
    const { args } = this.parse(SfccRamlintCommand);

    let results = await validator.parse(new URL(`file://${args.filename}`));

    if (results && results.conforms === true) {
      this.log("RAML is valid");
    } else {
      this.error("RAML is invalid", { exit: 1 });
    }
  }
}

SfccRamlintCommand.description = `A linting tool for raml for commerce cloud and beyond

FILENAME is a single RAML file to lint or a directory to scan for RAML files.
Files must end with a .raml extension.
`;

SfccRamlintCommand.flags = {
  // Add --version flag to show CLI version
  version: flags.version({ char: "v" }),
  // Add --help flag to show CLI version
  help: flags.help({ char: "h" }),
  name: flags.string({ char: "n", description: "name to print" })
};

SfccRamlintCommand.args = [{ name: "filename" }];

module.exports = SfccRamlintCommand;
