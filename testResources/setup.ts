/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import sinon from "sinon";
import { ramlToolLogger } from "../src/common/logger";

let ramlToolLoggerStub: sinon.SinonStub;
let consoleStub: sinon.SinonStub;

beforeEach(() => {
  ramlToolLoggerStub = sinon.stub(ramlToolLogger, "info");
  consoleStub = sinon.stub(console, "log");
});

afterEach(() => {
  ramlToolLoggerStub.restore();
  consoleStub.restore();
});
