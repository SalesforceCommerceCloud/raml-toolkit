const { Command, flags } = require("@oclif/command");
const validator = require("./validator");

class SfccRamlintCommand extends Command {
  async run() {
    const { args } = this.parse(SfccRamlintCommand);

    console.log(args.filename);
    let results = await validator.parse(new URL(`file://${args.filename}`));

    if (results.conforms === true) {
      this.log("RAML is valid");
    } else {
      this.error("RAML is invalid");
    }
  }
}

SfccRamlintCommand.description = `Describe the command here
...
Extra documentation goes here
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
