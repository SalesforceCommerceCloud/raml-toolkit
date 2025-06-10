/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export type RestApi = {
  id: string;
  name: string;
  groupId: string;
  assetId: string;
  description?: string;
  updatedDate?: string;
  version?: string;
  categories?: Categories;
  fatRaml?: FileInfo;
  fatOas?: FileInfo | null;
};

export type FileInfo = {
  classifier: string;
  packaging: string;
  externalLink?: string;
  createdDate: string;
  mainFile: string;
  md5: string;
  sha1: string;
};

export type Categories = {
  [key: string]: string[];
};

export type RawCategories = {
  key: string;
  value: string[];
};

export type RawRestApi = Omit<RestApi, "categories" | "fatRaml"> & {
  categories: RawCategories[];
  files: FileInfo[];
  instances: {
    environmentName: string;
    version: string;
  }[];
  versionGroups: {
    versions: {
      version: string;
    }[];
  }[];
};

export type ExchangeConfig = {
  dependencies?: {
    version: string;
    assetId: string;
    groupId: string;
  }[];
  version: string;
  originalFormatVersion: string;
  apiVersion: string;
  descriptorVersion: string;
  classifier: string;
  main: string;
  assetId: string;
  groupId: string;
  organizationId: string;
  name: string;
  tags: string[];
};
