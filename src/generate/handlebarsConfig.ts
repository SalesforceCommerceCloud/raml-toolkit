/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { getValue } from "./utils";
import * as helpers from "./handlebarsAmfHelpers";
import Handlebars from "handlebars";

const HandlebarsWithAmfHelpers = Handlebars.create();
for (const helper of Object.keys(helpers)) {
  HandlebarsWithAmfHelpers.registerHelper(helper, helpers[helper]);
}
HandlebarsWithAmfHelpers.registerHelper("getValue", getValue);

export { getValue, HandlebarsWithAmfHelpers };
