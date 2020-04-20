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

export class CommerceStandardsLoader implements amf.resource.ResourceLoader {
  public workingDir: string;
  public fsAdapter: FileSystemAdapter;

  constructor(rootFolder: string) {
    this.workingDir = rootFolder.split("file://")[1];
    if (!this.workingDir) {
      throw new Error("rootFolder does not contain 'file://' prefix");
    }
    this.fsAdapter = new FileSystemAdapter();
  }

  accepts(resource: string): boolean {
    return resource?.indexOf(EXCHANGE_MODULES) >= 0;
  }

  fetch(resource: string): Promise<amf.client.remote.Content> {
    return new Promise((resolve, reject) => {
      if (resource.indexOf(EXCHANGE_MODULES) >= 0) {
        const resourceUriPath = resource.split(EXCHANGE_MODULES);
        const resourceAbsolutePath = path.join(
          this.workingDir,
          EXCHANGE_MODULES,
          resourceUriPath[1]
        );

        try {
          const data = this.fsAdapter.readFileSync(resourceAbsolutePath);
          resolve(
            new amf.client.remote.Content(
              data,
              `file://${resourceAbsolutePath}`,
              "application/yaml"
            )
          );
        } catch (err) {
          reject(
            new amf.ResourceNotFound(
              `Resource failed to load: ${resource}. ${err.toString()}`
            )
          );
        }
      } else {
        reject(
          new amf.ResourceNotFound(`Resource cannot be found: ${resource}`)
        );
      }
    });
  }
}
