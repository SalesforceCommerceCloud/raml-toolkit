/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
  groupByCategory,
  removeRamlLinks,
  removeVersionSpecificInformation
} from "./exchangeTools";
import { RestApi } from "./exchangeTypes";

import _ from "lodash";

import { expect, default as chai } from "chai";
import chaiAsPromised from "chai-as-promised";

before(() => {
  chai.use(chaiAsPromised);
});

describe("Test groupByCategory method", () => {
  const apis: RestApi[] = [
    {
      id: "8888888/test-api/1.0.0",
      name: "Test API",
      groupId: "8888888",
      assetId: "test-api",
      version: "1.0.0"
    },
    {
      id: "8888888/test-api-2/1.0.0",
      name: "Test API 2",
      groupId: "8888888",
      assetId: "test-api-2",
      version: "1.0.0"
    },
    {
      id: "8888888/test-api-3/1.0.0",
      name: "Test API 3",
      groupId: "8888888",
      assetId: "test-api-3",
      version: "1.0.0"
    },
    {
      id: "8888888/test-api-4/1.0.0",
      name: "Test API 4",
      groupId: "8888888",
      assetId: "test-api-4",
      version: "1.0.0"
    }
  ];

  it("Group Apis with all same category", () => {
    const safeApisObject = _.cloneDeep(apis);
    safeApisObject.forEach(api => {
      api.categories = {
        "Api Family": ["something"]
      };
    });

    expect(groupByCategory(safeApisObject, "Api Family")).to.deep.equal({
      something: safeApisObject
    });
  });

  it("Group Apis with all same category w/o allowing unclassified", () => {
    const safeApisObject = _.cloneDeep(apis);
    safeApisObject.forEach(api => {
      api.categories = {
        "Api Family": ["something"]
      };
    });

    expect(groupByCategory(safeApisObject, "Api Family", false)).to.deep.equal({
      something: safeApisObject
    });
  });

  it("Group Apis with two categories", () => {
    const safeApisObject = _.cloneDeep(apis);

    safeApisObject[0].categories = {
      "Api Family": ["foo"]
    };
    safeApisObject[1].categories = {
      "Api Family": ["bar"]
    };
    safeApisObject[2].categories = {
      "Api Family": ["foo"]
    };
    safeApisObject[3].categories = {
      "Api Family": ["bar"]
    };

    expect(groupByCategory(safeApisObject, "Api Family")).to.deep.equal({
      foo: [safeApisObject[0], safeApisObject[2]],
      bar: [safeApisObject[1], safeApisObject[3]]
    });
  });

  it("Group Apis with four unique categories", () => {
    const safeApisObject = _.cloneDeep(apis);

    safeApisObject[0].categories = {
      "Api Family": ["foo"]
    };
    safeApisObject[1].categories = {
      "Api Family": ["bar"]
    };
    safeApisObject[2].categories = {
      "Api Family": ["see"]
    };
    safeApisObject[3].categories = {
      "Api Family": ["dog"]
    };

    expect(groupByCategory(safeApisObject, "Api Family")).to.deep.equal({
      foo: [safeApisObject[0]],
      bar: [safeApisObject[1]],
      see: [safeApisObject[2]],
      dog: [safeApisObject[3]]
    });
  });

  it("Group Apis with missing category and allow unclassified", () => {
    const safeApisObject = _.cloneDeep(apis);

    safeApisObject[0].categories = {
      "Api Family": ["foo"]
    };
    safeApisObject[2].categories = {
      "Api Family": ["see"]
    };
    safeApisObject[3].categories = {
      "Api Family": ["dog"]
    };

    expect(groupByCategory(safeApisObject, "Api Family")).to.deep.equal({
      foo: [safeApisObject[0]],
      see: [safeApisObject[2]],
      dog: [safeApisObject[3]],
      unclassified: [safeApisObject[1]]
    });
  });

  it("Group Apis with missing category without allowing unclassified", () => {
    const safeApisObject = _.cloneDeep(apis);

    safeApisObject[0].categories = {
      "Api Family": ["foo"]
    };
    safeApisObject[2].categories = {};

    safeApisObject[2].categories = {
      "Api Family": ["see"]
    };
    safeApisObject[3].categories = {
      "Api Family": ["dog"]
    };

    expect(() => groupByCategory(safeApisObject, "Api Family", false)).to.throw(
      "Unclassified APIs are NOT allowed!"
    );
  });

  it("Group Apis with wrong category while allowing unclassified", () => {
    const safeApisObject = _.cloneDeep(apis);

    safeApisObject[0].categories = {
      "Api Family": ["foo"]
    };
    safeApisObject[2].categories = {
      "CC Api Family": ["bar"]
    };

    safeApisObject[2].categories = {
      "Api Family": ["see"]
    };
    safeApisObject[3].categories = {
      "Api Family": ["dog"]
    };

    expect(groupByCategory(safeApisObject, "Api Family")).to.deep.equal({
      foo: [safeApisObject[0]],
      see: [safeApisObject[2]],
      dog: [safeApisObject[3]],
      unclassified: [safeApisObject[1]]
    });
  });
});

const REST_APIS: RestApi[] = [
  {
    id: "8888888/test-api/1.0.0",
    name: "Test API",
    groupId: "8888888",
    assetId: "test-api",
    fatRaml: {
      classifier: "rest-api",
      sha1: "sha1",
      md5: "md5",
      externalLink: "https://somewhere/fatraml.zip",
      packaging: "zip",
      createdDate: "today",
      mainFile: "api.raml"
    }
  },
  {
    id: "8888888/test-api2/1.0.0",
    name: "Test API",
    groupId: "8888888",
    assetId: "test-api",
    fatRaml: {
      classifier: "rest-api",
      sha1: "sha1",
      md5: "md5",
      externalLink: "https://somewhere/fatraml2.zip",
      packaging: "zip",
      createdDate: "today",
      mainFile: "api.raml"
    }
  }
];

describe("removeRamlLinks", () => {
  it("should remove fat RAML external links for all the apis", () => {
    const apis = _.cloneDeep(REST_APIS);
    removeRamlLinks(apis).forEach(
      api => expect(api.fatRaml.externalLink).to.be.undefined
    );
  });

  it("should not fail if the RAML does not have externalLink fields", () => {
    const apis = _.cloneDeep(REST_APIS);
    apis.forEach(apiEntry => {
      delete apiEntry.fatRaml.externalLink;
    });

    removeRamlLinks(apis).forEach(
      api => expect(api.fatRaml.externalLink).to.be.undefined
    );
  });

  it("should not do anything if an empty array is passed", () => {
    expect(removeRamlLinks([])).to.deep.equal([]);
  });

  it("should fail if null is passed", () => {
    expect(() => removeRamlLinks(null)).to.throw;
  });

  it("should fail if undefined is passed", () => {
    expect(() => removeRamlLinks(undefined)).to.throw;
  });
});

describe("removeVersionSpecificInformation", () => {
  it("should remove all the version specific information", () => {
    const api = _.cloneDeep(REST_APIS[0]);

    const result = removeVersionSpecificInformation(api);

    expect(result.id).to.be.null;
    expect(result.updatedDate).to.be.null;
    expect(result.version).to.be.null;
    expect(result.fatRaml.createdDate).to.be.null;
    expect(result.fatRaml.md5).to.be.null;
    expect(result.fatRaml.sha1).to.be.null;
    expect(result.fatRaml.externalLink).to.be.undefined;
  });

  it("should not fail if Fat RAML information is missing", () => {
    const api = _.cloneDeep(REST_APIS[0]);
    delete api.fatRaml;

    const result = removeVersionSpecificInformation(api);

    expect(result.fatRaml).to.be.undefined;
  });
});
