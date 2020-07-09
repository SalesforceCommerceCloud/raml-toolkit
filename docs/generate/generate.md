# SDK Generation

SDK's can be easily generated from RAML files using a group of tools in the raml-toolkit.

## API Classes

The API classes in this package provide a simple interface to read one or an entire collection of RAML files. The instances are then ready to use in [Handlebars](https://www.npmjs.com/package/handlebars) templates (Handlebars is an extension to the popular Mustache templating language).

For a single RAML file:
```javascript
import { Api } from "@commerce-apps/raml-toolkit";

Api.init("path/to/my-spec.raml").then(console.log);
```

For a group of RAML files:
```javascript
import { ApiGroup } from "@commerce-apps/raml-toolkit";

ApiGroup.init([
    "path/to/my-spec.raml",
    "path/to/my-other-spec.raml"
]).then(console.log);
```

Finally, for a collection of grouped RAML files:
```javascript
import { ApiCollection } from "@commerce-apps/raml-toolkit";

ApiGroup.init({
    "My First Group": [
        "path/to/my-spec.raml",
        "path/to/my-other-spec.raml"
    ],
    "My Second Group": [
        "path/to/favorite-spec.raml"
    ]
}).then(console.log);
```

## Handlebars AMF Helpers
handlebarsAmfHelpers module provides a number of functions to help easily access information from an AMF model. It also exports a Handlebars environment with all the handlebars AMF helper functions already registered. All the [handlebars-helpers](https://www.npmjs.com/package/handlebars-helpers) functions are also available through the Handlebars environment.

### Usage
Using the handlebars environment exported by handlbarsAmfHelpers:
```javascript
import {
  handlebarsAmfHelpers
} from "@commerce-apps/raml-toolkit";
const Handlebars = handlebarsAmfHelpers.handlebars;

const template = Handlebars.compile(
  fs.readFileSync(handlebarsTemplate, "utf8")
);
```

Using the handlebarsAmfHelpers functions registered with the Handlebars environment:
```
{{#each .}}
    {{#if (isTypeDefinition .)}}
export type {{getValue name}} = {};
    {{/if}}
{{/each}}
```
