# Rules for Diff Tool

## Rules to categorize differences

In rules, a difference can be categorized as Breaking or Non-Breaking.

If no rules are provided a default set of rules will be applied on the differences:

|Rule	|Category	|Description	|
|---	|---	|---	|
|version-changed	|Breaking	|Categorizes change in the API version	|
|display-name-changed	|Breaking	|Categorizes change in the display name of any end point operation	|
|operation-removed	|Breaking	|Categorizes removal of any end point operation	|
|parameter-removed	|Breaking	|Categorizes removal of any parameter (path, query, etc. ) in any end point operation	|
|required-parameter-added	|Breaking	|Categorizes addition of any required parameter (path, query, etc. ) in any end point operation	|
|example-changed	|Ignored	|Catagorizes any changes to the API spec examples	|
|operation-added	|Non-Breaking	|Categorizes addition of endpoint operation	|

## Defining your own rules

You can define your own rule set and provide it to the diff command. A rule set is defined as a json array. When you provide your own rule set the default rule set will not be applied.

To define rules, you need to understand how differences are generated.

1. Using [AMF](https://www.npmjs.com/package/amf-client-js), a flattened JSON-LD graph is generated for the the given APIs.
2. Differences are calculated for each node in the JSON-LD based on the node ID.
3. Then rules are applied on each node.

### **Example**

Below are the differences generated for version change and addition of a required parameter.

```
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

Rules to categorize the above differences. Each node difference is a fact which is called as “diff” in the rule.

```
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

 [json-rules-engine](https://www.npmjs.com/package/json-rules-engine) is used to apply the rules. Read the [rules document](https://github.com/CacheControl/json-rules-engine/blob/master/docs/rules.md) to understand more about the rules structure

### Custom Operators

json-rules-engine allows defining of custom operators to use along with the default ones. Diff tool library has the following custom operators that you can use in your rules.

|Operator	|Description	|
|---	|---	|
|hasProperty	|fact must have the given property 	|
|hasNoProperty	|fact must not have the given property	|