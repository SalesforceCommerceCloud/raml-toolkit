/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import amf from "amf-client-js";
import path from "path";
import { FileSystemAdapter } from "./fileSystemAdapter";

const EXCHANGE_MODULES = "exchange_modules/";
const FILE_PROTOCOL_REGEX = /^file:\/\//i;

export class FatRamlResourceLoader implements amf.resource.ResourceLoader {
  public fsAdapter: FileSystemAdapter;

  constructor(public workingDir: string) {
    this.workingDir = this.normalizeWorkingDir(this.workingDir);
    this.fsAdapter = new FileSystemAdapter();
  }

  normalizeWorkingDir(workingDir: string): string {
    let absoluteWorkingDir = this.workingDir?.split(FILE_PROTOCOL_REGEX)[1];
    if (!absoluteWorkingDir) {
      throw new Error("workingDir does not begin with 'file://' protocol");
    }
    absoluteWorkingDir = path.normalize(absoluteWorkingDir);
    if (!path.isAbsolute(absoluteWorkingDir)) {
      throw new Error(`workingDir '${workingDir}' must be an absolute path`);
    }
    return absoluteWorkingDir;
  }

  accepts(resource: string): boolean {
    return true
    return resource?.indexOf(EXCHANGE_MODULES) >= 0;
  }

  async fetch(resource: string): Promise<amf.client.remote.Content> {
    if (!resource || resource.indexOf(EXCHANGE_MODULES) < 0) {
      throw new amf.ResourceNotFound(`Resource cannot be found: ${resource}`);
    }

    const resourceUriParts = resource.split(EXCHANGE_MODULES);
    const resourceAbsolutePath = path.join(
      this.workingDir,
      EXCHANGE_MODULES,
      resourceUriParts[resourceUriParts.length - 1]
    );

    try {
      const data = this.fsAdapter.readFileSync(resourceAbsolutePath);
      return new amf.client.remote.Content(
        data,
        `file://${resourceAbsolutePath}`,
        "application/yaml"
      );
    } catch (err) {
      throw new amf.ResourceNotFound(
        `Resource failed to load: ${resource}. ${err.toString()}`
      );
    }
  }
}
