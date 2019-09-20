# sfcc-raml-linter
A linting tool for raml for commerce cloud and beyond


## Installation

Right now this isn't published to any npm repository.  The best way of installing this is to clone this repo right now.

1. Clone this repository
2. Install ramlint!

    ```bash    
    $ npm install && npm link
    ```
## Usage

To check your RAML currently the CLI just takes a list of files

```bash
$ ramlint file.raml
# or
$ ramlint file1.raml file2.raml etc.raml

```

The response will look something like

```
Model: file://data-products-api-v1.raml
Profile: sdk-ready
Conforms? false
Number of results: 2

Level: Violation

- Source: http://a.ml/vocabularies/data#require-api-description
  Message: The API Description must be set
  Level: Violation
  Target: file://data-products-api-v1.raml#/web-api
  Property: http://schema.org/description
  Position: Some(LexicalInformation([(2,0)-(1885,0)]))
  Location: file://data-products-api-v1.raml

- Source: http://a.ml/vocabularies/data#version-format
  Message: The version must be formatted as v[Major], for example v2
  Level: Violation
  Target: file://data-products-api-v1.raml#/web-api
  Property: http://schema.org/version
  Position: Some(LexicalInformation([(3,9)-(3,11)]))
  Location: file://data-products-api-v1.raml

 ›   Error: ./data-products-api-v1.raml is invalid
```

Let us look more closely at each of these errors.

The first error is saying that the API description is not set, but we need to have it set according to our standards.  There is a "Position:" field in the response but it is saying 2-1885. This happens to be the entire RAML document, ranges like this will be common for "Missing" components, since the parser doesn't know where you want to put it but knows you need to put it somewhere.

The second error, however, is because it exists, but doesn't match our standard.  There you can see that the position leads you to the exact line number and column of the non-conforming component. 

When there are no more violations the output will say it conforms, but also provide you with some warnings you might want to fix as well.

## Known issues and limitations

* Currently works only with local files

## Development Resources

Here is a amf validation example from Mulesoft.  This includes some custom rules you can use for reference when building rules.

https://github.com/mulesoft-labs/amf-validation-example
https://github.com/aml-org/amf/blob/develop/vocabularies/dialects/canonical_webapi.yaml
https://github.com/aml-org/amf/tree/develop/documentation/validations



