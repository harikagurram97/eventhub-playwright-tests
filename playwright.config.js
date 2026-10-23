// @ts-check
import { chromium, defineConfig, devices, firefox } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */

const config = {
  testDir: "./tests",
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  retries: 2,
  reporter: "html",
  use: {
    baseURL: "https://eventhub.rahulshettyacademy.com",
    headless: false,
  },
  projects: [
    {
      name: "chromium",
    },
    {
      name: "firefox",
    },
  ],
};

module.exports = config;
