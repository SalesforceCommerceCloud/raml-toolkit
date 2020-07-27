/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as helpers from "./handlebarsAmfHelpers";
import Handlebars, { HelperDelegate } from "handlebars";
import fs from "fs-extra";

const HandlebarsWithAmfHelpers = Handlebars.create();
for (const helper of Object.keys(helpers)) {
  HandlebarsWithAmfHelpers.registerHelper(helper, helpers[helper]);
}

export function registerPartial(name: string, partialPath: string): void {
  const partial = HandlebarsWithAmfHelpers.compile(
    fs.readFileSync(partialPath, "utf8")
  );
  HandlebarsWithAmfHelpers.registerPartial(name, partial);
}

export function registerHelper(name: string, helper: HelperDelegate): void {
  HandlebarsWithAmfHelpers.registerHelper(name, helper);
}

export { HandlebarsWithAmfHelpers };
