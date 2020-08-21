# Contributing

To contribute to this project, follow the guidelines below. This helps us address your pull request in a more timely manner.

## Submit a Pull Request

  1. Create a new issue. It allows us to easily communicate with you about the issue.
  2. Create a fork of this repository.
  3. Create a branch off the master branch.
  4. Add your changes to the fork.
  5. Create a pull request against the master branch.
  6. Grant _dx-runtime_ team access to your fork so we can run automated tests on your pull request prior to merging it.

## Best Practices

* To reduce merge conflicts, squash and rebase your branch before submitting your pull request.
* If applicable, reference the issue number in the comments of your pull request.
* In your pull request, include:
  * A brief description of the problem and your solution
  * Steps to reproduce
  * Screen shots
  * Error logs
* Make sure that your code builds and passes the unit tests.
* Monitor your pull requests. Please respond in a timely manner to any comments, questions for changes requested. We may close abandoned pull requests.

## What To Expect

After you submit your pull request, we'll look it over and consider it for merging.

As long as your submission has met the above guidelines, we should merge it in a timely manner.

## Contributor License Agreement (CLA)

All external contributors must sign our Contributor License Agreement (CLA).

## Development Tips

This project is a multi-command [Oclif](https://oclif.io/) CLI. For detailed information about the framework, refer to their documentation.

### Adding a new command

If you want to add a new command, for example `raml-toolkit my-command`, the following structure is recommended:

```txt
src
├─┬ commands
│ └── my-command.ts
├─┬ common
│ ├── util.test.ts
│ └── util.ts
└─┬ my-command
  ├── helpers.test.ts
  ├── helpers.ts
  ├── myCommand.test.ts
  ├── myCommand.ts
  └── index.ts
```

* Your command _must_ be the default export from `src/commands/my-command.ts` and should be the only content in the file.
* The implementation should be located in the `src/my-command` directory.
* The `src/my-command` directory can be structured in whatever way makes sense for the command.
* Functionality used by multiple commands should be located in `src/common`.
* All implementation files should be accompanied by test files of the same name that test the implementation.

### Testing commands

* To run the compiled JavaScript, run `./bin/run my-command ...`
* To run the TypeScript source, run `./bin/run-dev my-command ...`

### Debugging Oclif

Oclif is inextricably tied to the compiled JavaScript. If something isn't working, run `npm run compile` and try again.

When writing tests for a command, the `@oclif/test` package provides helpful utilities. However, its `.command` method relies on the compiled JavaScript, which our coverage reporter (`nyc`) cannot handle. Use the following as a workaround:

```typescript
import { test } from "@oclif/test";
import { MyCommand } from ".";
// Do not do this. Code coverage will fail.
test
    .command(["my-command", "example argument", "--example-flag"])
    .it("runs the command successfully");
// Do this instead. Code coverage will work as desired.
test
    .do(() => MyCommand.run(["example argument", "--example-flag"]))
    .it("runs the command successfully");
```

### Updating the README

To update the README when adding or changing a command, simply run `npx oclif-dev readme`. This will automatically update the text, but it will also change the headings to the incorrect level. Be sure to change them back before committing the updates.

### Adding a new diff output format

[Handlebars](http://handlebarsjs.com/) is used as the templating engine. Output for the diff command is generated from files in `resources/diff/templates`. The naming convention for template files is `ClassName.type.hbs`. For example, the file for the `ApiChanges` console format is `ApiChanges.console.hbs`.  Once created, the format will automatically be available via the specified class's `toFormattedString` method. To allow the format to be used via the CLI, add it to the list for the `format` flag in [diffCommand.ts](../src/diff/diffCommand.ts).
