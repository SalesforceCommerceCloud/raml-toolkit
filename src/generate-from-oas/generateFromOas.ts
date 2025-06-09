/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from "path";
import { execSync } from "child_process";
import { string, boolean } from "@oclif/parser/lib/flags";

// Path relative to project root
export const DEFAULT_CONFIG_BASE_PATH =
  "resources/generate-from-oas/config/config.yaml";

export const DEFAULT_CONFIG_PATH = path.join(
  __dirname,
  "../../",
  DEFAULT_CONFIG_BASE_PATH
);

// Path prefixed with package name, short form usable by require()
export const DEFAULT_CONFIG_PACKAGE_PATH = path.join(
  "@commerce-apps/raml-toolkit",
  path.dirname(DEFAULT_CONFIG_BASE_PATH),
  path.basename(DEFAULT_CONFIG_BASE_PATH)
);

export const generateFromOas = (args: {
  inputSpec: string;
  outputDir: string;
  templateDir: string;
  configFile?: string;
  generator?: string;
  skipValidateSpec?: boolean;
  flags?: string;
}) => {
  const {
    inputSpec,
    outputDir,
    templateDir,
    configFile,
    generator,
    skipValidateSpec,
    flags,
  } = args;
  const skipValidateSpecFlag = skipValidateSpec ? "--skip-validate-spec" : "";
  const _configFile = configFile ? configFile : DEFAULT_CONFIG_PATH;
  const _generator = generator ? generator : "typescript-fetch";
  const _flags = flags ? flags : "";

  execSync(
    `openapi-generator-cli generate -i ${inputSpec} -o ${outputDir} -t ${templateDir} -g ${_generator} -c ${_configFile} ${skipValidateSpecFlag} ${_flags}`
  );
};
