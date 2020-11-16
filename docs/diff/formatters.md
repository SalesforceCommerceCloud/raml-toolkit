# Formatting the Diff Output

The default output format for the diff tool is JSON. Use `toFormattedString` to view on the user console.

```typescript
import { ApiChanges } from "@commerce-apps/raml-toolkit/lib/diff/changes/apiChanges";
import { ApiDifferencer } from "@commerce-apps/raml-toolkit/lib/diff/apiDifferencer";

const apiDifferencer = new ApiDifferencer("diff/left.raml", "diff/right.raml");

apiDifferencer.findAndCategorizeChanges().then((changes: ApiChanges) => {
    // JSON is default output format
    console.log(changes);
    // Use to view on the user console
    console.log(changes.toFormattedString("console"));
});
```

Handlebars templates format the output. To customize the output, copy the template in `resources/diff/templates`, modify it, and apply it as shown here.

```typescript
import { ApiChanges } from "@commerce-apps/raml-toolkit/lib/diff/changes/apiChanges";
import { ApiDifferencer } from "@commerce-apps/raml-toolkit/lib/diff/apiDifferencer";
import { Formatter } from "@commerce-apps/raml-toolkit/lib/diff/formatter";

const apiDifferencer = new ApiDifferencer("diff/left.raml", "diff/right.raml");

apiDifferencer.findAndCategorizeChanges().then((changes: ApiChanges) => {
    const formatter = new Formatter();
    const customReport = formatter.render(
      "ApiChanges.custom.hbs",
      changes.getTemplateData()
    );
    console.log(customReport);
});
```
