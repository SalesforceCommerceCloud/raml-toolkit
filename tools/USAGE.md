# Raml Toolkit Tools

A tool to lint & verify all commerce-sdk endpoints in an isolated container. 

- [Pre-Requisites](#usage)
- [Usage](#usage)

## Pre-Requisites

This tool uses docker to lint and verify all commerce-sdk endpoints. 
The tool requires [raml-toolkit](https://github.com/SalesforceCommerceCloud/raml-toolkit) and 
[commerce-sdk](https://github.com/SalesforceCommerceCloud/commerce-sdk) repositories cloned to your local computer. 

* Install [Docker Engine](https://docs.docker.com/engine/install/) 
* Git clone [raml-toolkit](https://github.com/SalesforceCommerceCloud/raml-toolkit) repository
* Git clone [commerce-sdk](https://github.com/SalesforceCommerceCloud/commerce-sdk) repository

## Usage

The docker container requires `raml-toolkit` directory mounted as `/linter` volume and 
`commerce-sdk/apis` directory mounted as `/apis` volume. You can do so as follows

```shell script
$ docker run -t -d --name linter -v /<<raml-toolkit absolute path>>:/linter -v /<<commerce-sdk/apis absolute path>>:/apis node
```

You can check all commerce-sdk endpoints as follows

```shell script
$ docker exec linter chmod 544 /linter/tools/lint.sh && docker exec linter /linter/tools/lint.sh 
```
The response will look something like 

```bash
Command failed: npx /linter/commerce-apps-raml-toolkit-0.3.1.tgz /apis/customers/customers.raml -p mercury
npx: installed 153 in 66.225s
 ›   Error: Validation for 1 file(s) failed.
 Model: file:///apis/customers/customers.raml
Profile: mercury
Conforms? false
Number of results: 1

Level: Violation

- Source: http://a.ml/vocabularies/data#camelcase-method-displayname
  Message: The API Method must have displayName and the value must be in camelcase
  Level: Violation
  Target: file:///apis/customers/customers.raml#/web-api/end-points/%2Forganizations%2F%7BorganizationId%7D%2Fcustomer-lists%2F%7BlistId%7D%2Fcustomers%2F%7BcustomerNo%7D%2Faddresses/post
  Property: http://schema.org/name
  Position: Some(LexicalInformation([(782,26)-(782,64)]))
  Location: file:///apis/customers/customers.raml

npx: installed 153 in 70.19s
 Model: file:///apis/catalogs/catalogs.raml
  Profile: mercury
  Conforms? true
  Number of results: 0
  Number of hidden warnings: 357

...
```

Refer to this Raml Toolkit [README](../README.md) for detailed definitions of these errors. 
