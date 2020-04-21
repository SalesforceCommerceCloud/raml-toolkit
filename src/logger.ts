/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as log from "loglevel";

const RAML_TOOL_LOGGER_KEY = "RAML_TOOL_LOGGER";

const ramlToolLogger = log.getLogger(RAML_TOOL_LOGGER_KEY);
ramlToolLogger.setLevel(log.levels.INFO);

export { RAML_TOOL_LOGGER_KEY, ramlToolLogger };
