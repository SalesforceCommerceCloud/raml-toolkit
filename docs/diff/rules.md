# Rules for Diff Tool

## Rules to categorize differences

The Diff Tool rules categorize differences as Breaking or Non-Breaking.

If rules aren't provided, differences are handled by a default set of rules.

### Default Rules

|Rule |Category |Description |
|--- |--- |--- |
|version-changed |Breaking |Categorizes change in the API version |
|display-name-changed |Breaking |Categorizes change in the display name of any endpoint operation |
|operation-removed |Breaking |Categorizes removal of any endpoint operation |
|parameter-removed |Breaking |Categorizes removal of any parameter (path, query, etc. ) in any endpoint operation |
|required-parameter-added |Breaking |Categorizes addition of any required parameter (path, query, etc. ) in any endpoint operation |
|example-changed |Ignored |Catagorizes any changes to the API spec examples |
|operation-added |Non-Breaking |Categorizes addition of endpoint operation |

## Defining your own rules

You can define your own rule set and provide it as a parameter when calling the diff command. A rule set is defined as a json array. When you provide your own rule set, the default rule set isn't used.

To define rules, you need to understand how differences are generated.

1. Using [AMF](https://www.npmjs.com/package/amf-client-js), a flattened JSON-LD graph is generated for the given APIs.
2. Differences are calculated for each node in the JSON-LD based on the node ID.
3. Rules are applied on each node.

### **Example**

Here's an example of the differences when changing the version or adding a required parameter.

```json
[
  {
    "id": "#/web-api",
    "type": [
      "apiContract:WebAPI",
      "doc:RootDomainElement",
      "doc:DomainElement"
    ],
    "added": {
      "core:version": "v2"
    },
    "removed": {
      "core:version": "v1",
      "apiContract:endpoint": [
        {
          "@id": "#/web-api/end-points/%2Forganizations%2F%7BorganizationId%7D%2Fcategories%2F%7Bid%7D"
        }
      ]
    }
  },
  {
    "id": "#/web-api/end-points/%2Forganizations%2F%7BorganizationId%7D%2Fproducts/get/request/parameter/newParam",
    "type": [
      "apiContract:Parameter",
      "doc:DomainElement"
    ],
    "added": {
      "@id": "#/web-api/end-points/%2Forganizations%2F%7BorganizationId%7D%2Fproducts/get/request/parameter/newParam",
      "@type": [
        "apiContract:Parameter",
        "doc:DomainElement"
      ],
      "core:name": "newParam",
      "apiContract:paramName": "newParam",
      "core:description": "New param added for testing.",
      "apiContract:required": true,
      "apiContract:binding": "query",
      "raml-shapes:schema": {
        "@id": "#/web-api/end-points/%2Forganizations%2F%7BorganizationId%7D%2Fproducts/get/request/parameter/newParam/scalar/schema"
      }
    },
    "removed": {},
    "rule": {
      "name": "Rule to detect required parameter addition",
      "type": "required-parameter-added",
      "params": {
        "category": "Breaking"
      }
    }
  }
 ]
```

Here are the rules that categorize the differences. Each node difference has a fact that is a 'diff' in the rule.

```json
[
  {
    "name": "Rule to detect version change",
    "conditions": {
      "all": [
        {
          "fact": "diff",
          "path": "$.type",
          "operator": "contains",
          "value": "apiContract:WebAPI"
        },
        {
          "fact": "diff",
          "path": "$.added",
          "operator": "hasProperty",
          "value": "core:version"
        },
        {
          "fact": "diff",
          "path": "$.removed",
          "operator": "hasProperty",
          "value": "core:version"
        }
      ]
    },
    "event": {
      "type": "version-changed",
      "params": {
        "category": "Breaking"
      }
    }
  },
  {
    "name": "Rule to detect required parameter addition",
    "conditions": {
      "all": [
        {
          "fact": "diff",
          "path": "$.type",
          "operator": "contains",
          "value": "apiContract:Parameter"
        },
        {
          "fact": "diff",
          "path": "$.added",
          "operator": "hasProperty",
          "value": "core:name"
        },
        {
          "fact": "diff",
          "path": "$.added.apiContract:required",
          "operator": "equal",
          "value": true
        },
        {
          "fact": "diff",
          "path": "$.removed",
          "operator": "hasNoProperty",
          "value": "core:name"
        }
      ]
    },
    "event": {
      "type": "required-parameter-added",
      "params": {
        "category": "Breaking"
      }
    }
  },
  {
    "name": "Rule to ignore changes in examples",
    "conditions": {
      "any": [
        {
          "fact": "diff",
          "path": "$.type",
          "operator": "contains",
          "value": "apiContract:Example"
        }
      ]
    },
    "event": {
      "type": "example-changed",
      "params": {
        "category": "Ignored"
      }
    }
  }  
]
```

 [json-rules-engine](https://www.npmjs.com/package/json-rules-engine) applies the rules. See [rules document](https://github.com/CacheControl/json-rules-engine/blob/master/docs/rules.md) for details on the rules structure.

### Custom Operators

json-rules-engine lets you define either custom or default operators.The Diff tool library offers these custom operators that you can use in your rules:

|Operator |Description |
|--- |--- |
|hasProperty |The fact must include the given property. |
|hasNoProperty |The fact can't include the given property. |
