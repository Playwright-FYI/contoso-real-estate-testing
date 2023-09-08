# Testing Contoso With Playwright


## 1. Pre-Requisites

To run _this_ Contoso Real Estate E2E test suite you need:

- GitHub account with GitHub Codespaces activated.
- A Contoso Real Estate deployment on Azure
- A env.local file setup with specified env variables

## 2. Dev Container

For efficiency, we use a DevContainer provisioned with the following:
 - The Playwright-recommended container image, 
 - The Visual Studio Code extension for Playwright
 - The GitHub Copilot and GitHub Copilot Chat extensions (optional)
 - The Dev Container extension (to help manage local/remote usage)
 
Note: The default Playwright container image has the Playwright executable and browser dependencies installed by default. However, you can also configure a different (pre-existing) container.json file to install these in the post-create config (e.g., if we move these into the Azure-Samples folder).

## 3. Playwright Test Configuration

The Playwright Test runner is configured using a [TestConfig](https://playwright.dev/docs/api/class-testconfig) object that has a number of properties to configure everything from _locations_ (e.g., for test folders, test outputs etc) to _timeouts_ and _projects_ which define thebrowsers (and/or device emulators) to use as targets for the test run.

These values are populated from the relevant properties set in a _configuration file_. By default, Playwright looks for `playwright.config.ts` in the running directory. If no such file is found, it will start the Test Runner with all configuration properties assuming default values.

You can explicitly specify a different playwright configuration file path using `npx playwright test --config <file>`. This could be helpful if you want to keep a version of the configuration file with different runtime context. 
- Ex: You may want to test the application against a local deployment, and want a configuration that sets up the _webserver_ to launch the application dev-server before running the tests. 

You can also _override_ some of the configuration file based settings directly from the command-line. Check out [this reference list](https://playwright.dev/docs/test-cli#reference) for supported options.

## 4. Playwright Test `use` options

The Playwright Test configuration typically focuses on configuring the _Test Runner_ that executes the tests. However, to execute the test, the Test Runner will use a _Browser_ (e.g., 'Chromium' project), with a new _BrowserContext_ for each test, to [achieve test isolation](https://playwright.dev/docs/browser-contexts#how-playwright-achieves-test-isolation). These also have configurable properties including:
 - _Emulation_ - of real device profiles (mobile, tablet)
 - _Recording_ - of screenshots, videos or traces
 - _Network_ - http credentials, headers, offline state, proxy
 - _Browser_ - name, channel to use, headless mode etc. 
 - _Browser Context_ - user agent, viewport, launch options etc.

All of these can be set by specifying the relevant properties inside a Test `use: {}` object within the configuration object. This configuration has an associted _scope_.
 - Configure it in file for global scope
 - Add a `use:{}` within `project` to override at TestProject level
 - Use `test.use({ })` in the _arrange_ step to override per test case.

Pay special attention to the `baseURL` property configured with `use:{}`. This allows you to then use _relative paths_ for [navigational actions](https://playwright.dev/docs/test-webserver#adding-a-baseurl) and have them automatically resolve to fully-qualified URLs with this prefix. Now, by using the configuration scope, you can also set one baseURL on a global basis, but override it on a per-test or per-project basis for specialized testing.

## 5. Environment Variables

Playwright is configured to read environment variables using 'dotenv'. These are then made available to the application using `process.env.<VARNAME>` syntax. 

The `.env.local.example` file shows you the environment variables required. If using this project for the first time, rename that file to `.env.local` and update those values before you run. 

For convenience, this test suite has a `1.validate.spec.ts` that does a simple liveness check on your Portal app, by checking if it can go the page and click a button. This test gets run automatically on every container rebuild or Codespaces launch - to turn that off, comment out the line in `.devcontainer.json/post-create.sh`

⭐️ | You can configure environment variables as [GitHub Codespaces Secrets](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-secrets-for-your-codespaces) where a given variable can now be shared amongst multiple repositories. This is useful for things like _API_KEY_ values but we will not be using this approach here, and instead rely on .env.local for local testing - and appropriate equivalents for different [CI/CD configurations](https://playwright.dev/docs/ci#ci-configurations).

## 6. Test Folder

The `testDir` configuration property specifies the _top-level_ folder that contains **all** the test specifications for this Test Runner. Anything in this sub-tree is _implicitly discoverable_ by the Test Runner for execution.

Tests can be organized into sub-folders (e.g., by type), and each folder can contain multiple Test specifications (*.spec.ts files). The Playwright Test runner can now be run with a specific (named) test, folder, or other annotations - as a way to filter or target specific tests to run.

If not filtering constraints are given, Playwright Test will execute _all_ tests under this folder, using the default configuration parameters in `playwright.config.ts`.

## 7. Test Specification

A Test Specification file (`*.spec.ts`) defines a unit of testing work for the Test Runner. By default, all tests in the same file are _run in order_, on a single worker. If Playwright is configured for multiple projects (e.g., target multiple browsers), then the same test specification will be executed once per project. The test specification structure, and test runner configuration properties, both have implications for [Parallelism](https://playwright.dev/docs/test-parallel) - or the ability to run tests _concurrently_ for efficiency.

Here is the test specification from `e2e/1-validate.spec.ts`. As a best practice, tests are set up in the `Arrange-Act-Assert` pattern:
 - Arrange = setup state before you test
 - Act = perform the test action
 - Assert = verify post-execution state matches expectations

See the annotations below to understand how that works:

```ts
import { test, expect } from '@playwright/test';

// Test Suite: a group of tests with common title
test.describe('My Validation Test Suite',() => {

  // Hooks: setup state, is the 'Arrange' step
  test.beforeEach(async ({ page }) => {
    console.log("Starting a new test ..")
  });

  // Test Case #1: is a single test() call for reporting
  test('has title', async ({ page }) => {
    // Test Action: executes an action like navigation
    await page.goto('/');
    // Test Assertion: checks if expectations are met
    await expect(page).toHaveTitle(/Contoso Real Estate/);
  });

  // Test Case #2: continues user journey in multi-page flow
  test('get started link', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Browse listings' }).click();
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
  });

  // Hooks: teardown state, cleanup from 'Arrange' step
  test.afterAll(async () => {
    console.log('Finished all sets in this suite');
  });

});
```

## 8. Test Types

The most common set of tests validates _user journeys_ - multi-page or multi-component interactions that take the user through an "end-to-end" user scenario. However, there are also other popular types of tests you can execute with Playwright. These include:

- [API Testing](https://playwright.dev/docs/api-testing) - Validate requests made to API endpoints
- [API Mocking](https://playwright.dev/docs/mock) - Validate API usage (in e2e flows) with mocked responses 
- [Authentication Testing](https://playwright.dev/docs/auth) - Test authentication, with stored credentials for CI/CD
- [Accessibility Testing](https://playwright.dev/docs/api/class-accessibility) - validate WCAG compliance with aXe-core drivers and rules.
- [Visual Comparisons](https://playwright.dev/docs/test-snapshots) - compare current screenshot to reference (good) capture.
- [Emulation](https://playwright.dev/docs/emulation) - evaluate user experience on ["real" device profiles](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptorsSource.json) e.g., phone, tablet.

Plus experimental support for [component testing](https://playwright.dev/docs/test-components) - currently for React, Solid, Svelte and Vue - and other testing features in early preview. Read on for where you can find relevant examples for Contoso.

## 9. Tests Organization

As mentioned earlier, Playwright can automatically discover any _named_ test if it exists within the subtree of the specified `testDir` directory. However, organizing these into some meaningful set of _named subfolders_ has 2 key benefits:
- It gives project collaborators a sense of where to look for specific tests.
- It lets you disambiguate between similarly named tests at command-line.

For example: <br/>
My `testDir` points to `e2e/` - so let's say I create the following testing hierarchy. For now, these just contain some dummy test files.

```bash
# Listing of files and folders in e2e/
  1-validate.spec.ts  
  2-core/  
    example.spec.ts
  3-api/  
    example.spec.ts
  4-auth/  
    github.spec.ts
  5-ui/  
    portal-ui.spec.ts
  6-other/  
    emulation.spec.ts
    mocking.spec.ts
    comparison.spec.ts
  7-todo-demo.spec.ts
```

Now, let me ask Playwright to run the `example.spec.ts` specification:

```bash
$ npx playwright test example.spec.ts

Running 4 tests using 3 workers
[chromium] › 3-api/example.spec.ts:9:7 › My Validation Test Suite › has title
Starting a new test ..
[chromium] › 2-core/example.spec.ts:14:7 › My Validation Test Suite › get started link
Starting a new test ..
[chromium] › 2-core/example.spec.ts:9:7 › My Validation Test Suite › has title
Starting a new test ..
[chromium] › 3-api/example.spec.ts:9:7 › My Validation Test Suite › has title
Finished all sets in this suite
[chromium] › 2-core/example.spec.ts:9:7 › My Validation Test Suite › has title
Finished all sets in this suite
[chromium] › 3-api/example.spec.ts:14:7 › My Validation Test Suite › get started link
Starting a new test ..
[chromium] › 2-core/example.spec.ts:14:7 › My Validation Test Suite › get started link
Finished all sets in this suite
[chromium] › 3-api/example.spec.ts:14:7 › My Validation Test Suite › get started link
Finished all sets in this suite
  4 passed (3.6s)
```

Note that it finds and runs _both_ the example.spec.ts files in this subtree - and because we have uniquely named folders, we can immediately see which "example" specfication was generating each test result.

But I can also specify just the one by providing enough of a qualified path to differentiate between them and it resolves correctly!

```bash
$ npx playwright test 2-core/example.spec.ts

Running 2 tests using 2 workers
[chromium] › 2-core/example.spec.ts:14:7 › My Validation Test Suite › get started link
Starting a new test ..
[chromium] › 2-core/example.spec.ts:9:7 › My Validation Test Suite › has title
Starting a new test ..
Finished all sets in this suite
[chromium] › 2-core/example.spec.ts:14:7 › My Validation Test Suite › get started link
Finished all sets in this suite
  2 passed (2.5s)
```

## 10. Tests Annotations

But wait, you can do more. What if you only want to run a _subset_ of tests within a single specification, or you want to manage _how_ a specific test case within the specification is run. This is where [Test Annotations](https://playwright.dev/docs/test-annotations) help.
 - `test.skip()` - will skip running the test, and report it as skipped
 - `test.fail()` - will verify test fails, and complain if it passed.
 - `test.fixme()` - lets you mark a test as failing, without running it.
 - `test.slow()` - marks test as slow and triples the timeout.
 - `test.only()` - focuses on running only these tests

You can _conditionally_ skip a test, or a group of tests. You can also tag a test using an `@` annotation in its description:
 - at a suite level: `test.describe('My Validation Test Suite @core',() => {..}`
 - at a test level: `test('has title @speedy', async ({ page }) => {`

Now, use those _annotations_ with `--grep` to run only matching tests.

```bash
# Found the matching suite, which had 2 tests
npx playwright test --grep @core   
Running 2 tests using 2 workers

# Found only the 1 test that matched
$ npx playwright test --grep @speedy
Running 1 test using 1 worker

# But wait, you can use regex to match both
# It finds the 1 test in the suite that matched
$ npx playwright test --grep "(?=.*@core)(?=.*@speedy)"
Running 1 test using 1 worker
```

That's a crash course on Playwright Test Specification writing. Now let's write the tests for Contoso Real Estate.
