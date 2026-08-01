"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { renderRegisterPageWithErrors } = require("../lib/renderRegisterPage");

test("all-empty submission autofocuses first-name and shows no error summary", () => {
  const html = renderRegisterPageWithErrors(
    [
      { field: "first-name", message: "Enter your first name." },
      { field: "last-name", message: "Enter your last name." },
      { field: "email", message: "Enter your email address." },
      { field: "privacy-agreement", message: "Confirm that you have read the Community Privacy Notice." }
    ],
    {}
  );

  assert.ok(!html.includes('id="error-summary"'), "the removed error summary must not reappear");
  assert.ok(!html.includes('role="alert"'));
  assert.match(html, /<title>There is a problem - Join the Community - Open Door Design<\/title>/);

  const firstNameTag = html.match(/<input id="first-name"[^>]*>/)[0];
  assert.match(firstNameTag, /autofocus/);
  assert.match(firstNameTag, /aria-invalid="true"/);

  const lastNameTag = html.match(/<input id="last-name"[^>]*>/)[0];
  assert.ok(!lastNameTag.includes("autofocus"), "only the first invalid field gets autofocus");
});

test("malformed email produces the distinct format message and preserves other values", () => {
  const html = renderRegisterPageWithErrors(
    [{ field: "email", message: "Enter an email address in a valid format." }],
    { firstName: "Dean", lastName: "O'Brien", email: "not-an-email" }
  );

  assert.match(html, /Enter an email address in a valid format\./);
  assert.match(html, /value="Dean"/);
  assert.match(html, /value="O'Brien"/);
});

test("submitted checkbox values are re-checked and HTML-escaped", () => {
  const html = renderRegisterPageWithErrors(
    [{ field: "email", message: "Enter your email address." }],
    {
      aboutYou: "<script>alert(1)</script>",
      interests: ["Accessibility education"]
    }
  );

  assert.ok(!html.includes("<script>alert(1)</script>"), "user input must never be reflected unescaped");
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /value="Accessibility education" checked/);
});
