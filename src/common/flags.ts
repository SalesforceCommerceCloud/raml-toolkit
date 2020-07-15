/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags } from "@oclif/command";
import { LogLevelDesc } from "loglevel";
import { ramlToolLogger as logger } from "./logger";

/**
 * This flag sets the log level for the command based on the given value. No
 * special handling is required by the command. The flag accepts as a value
 * anything that log.setLevel() accepts, and passes to the command the integer
 * returned by log.getLevel().
 * @param options - Flag options
 */
export const verbosity = flags.build({
  char: "V",
  description: "Set the level of detail in the output",
  env: "RAML_TOOLKIT_VERBOSITY",
  options: Object.keys(logger.levels).map(l => l.toLowerCase()),
  parse(input: string): number {
    try {
      const int = parseInt(input, 10);
      const level = Number.isNaN(int) ? input : int;
      logger.setLevel(level as LogLevelDesc);
    } catch (err) {
      // Error text matches flags.enum when an invalid value is given
      throw new Error(
        `Expected --${this.name}=${input} to be one of: ${this.options.join(
          ", "
        )}`
      );
    }
    return logger.getLevel();
  }
});

/**
 * The oclif help flag builder, with char set to -h, description changed to
 * start with a capital letter, and hidden by default.
 * @param options - Flag options
 */
export function help(
  options?: Parameters<typeof flags.help>["0"]
): ReturnType<typeof flags.help> {
  return flags.help({
    char: "h",
    description: "Show CLI help",
    hidden: true,
    ...options
  });
}

/**
 * The oclif version flag builder, with char set to -v, description changed to
 * start with a capital letter, and hidden by default.
 * @param options - Flag options
 */
export function version(
  options?: Parameters<typeof flags.version>["0"]
): ReturnType<typeof flags.version> {
  return flags.version({
    char: "v",
    description: "Show CLI version",
    hidden: true,
    ...options
  });
}

/**
 * Create a flags object with all common flags set to their default values.
 * @example
 * class ExampleCommand extends Command {
 *   static flags = {
 *     ...buildAll(),
 *     exampleFlag: flags.boolean()
 *   }
 * }
 */
export function buildAll(): {
  help: ReturnType<typeof help>;
  verbosity: ReturnType<typeof verbosity>;
  version: ReturnType<typeof version>;
} {
  return {
    help: help(),
    verbosity: verbosity(),
    version: version()
  };
}
