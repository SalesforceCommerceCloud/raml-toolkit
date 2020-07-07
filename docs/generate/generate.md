# SDK Generation

SDK's can be easily generated from RAML files using a group of tools in the raml-toolkit.

## API Classes

The API classes in this package provide a simple interface to read one or an entire collection of RAML files. The instances are then ready to use in [Handlebars](https://www.npmjs.com/package/handlebars) templates (Handlebars is an extension to the popular Mustache templating language).

For a single RAML file:
```javascript
import { Api } from "@commerce-apps/raml-toolkit";

Api.read("path/to/my-spec.raml").then(console.log);
```

For a group of RAML files:
```javascript
import { ApiGroup } from "@commerce-apps/raml-toolkit";

ApiGroup.read([
    "path/to/my-spec.raml",
    "path/to/my-other-spec.raml"
]).then(console.log);
```

Finally, for a collection of grouped RAML files:
```javascript
import { ApiCollection } from "@commerce-apps/raml-toolkit";

ApiGroup.read({
    "My First Group": [
        "path/to/my-spec.raml",
        "path/to/my-other-spec.raml"
    ],
    "My Second Group": [
        "path/to/favorite-spec.raml"
    ]
}).then(console.log);
```