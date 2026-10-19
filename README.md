# EventHub Playwright Project

**`playwright` (core package)**

- The browser automation library. It gives you the API to launch browsers, open pages, click, type, and read content (e.g. `chromium.launch()`, `page.goto()`).
- It has no test structure of its own. There is no `test()` function, no built-in assertions, no reports, and no parallel runs.

**`@playwright/test` (test runner package)**

- Built on top of the core package and includes it as a dependency.
- Adds everything needed for testing: `test` and `expect`, fixtures (like `page`), parallel execution, retries, HTML reports, traces and screenshots, and `playwright.config.js`.
- Tests are run with `npx playwright test`.
