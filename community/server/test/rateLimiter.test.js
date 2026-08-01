"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { createRateLimiter } = require("../lib/rateLimiter");

function mockRequest(ip) {
  return { ip };
}

function mockResponse() {
  const response = {
    statusCode: null,
    headers: {},
    body: null,
    set(name, value) {
      response.headers[name] = value;
      return response;
    },
    status(code) {
      response.statusCode = code;
      return response;
    },
    type() {
      return response;
    },
    send(body) {
      response.body = body;
      return response;
    }
  };
  return response;
}

test("allows requests under the limit", () => {
  const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 3 });
  let nextCalls = 0;
  const next = () => { nextCalls += 1; };

  limiter(mockRequest("1.2.3.4"), mockResponse(), next);
  limiter(mockRequest("1.2.3.4"), mockResponse(), next);
  limiter(mockRequest("1.2.3.4"), mockResponse(), next);

  assert.equal(nextCalls, 3);
});

test("rejects requests over the limit with 429 and Retry-After", () => {
  const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 });
  const next = () => {};

  limiter(mockRequest("5.6.7.8"), mockResponse(), next);
  limiter(mockRequest("5.6.7.8"), mockResponse(), next);
  const response = mockResponse();
  limiter(mockRequest("5.6.7.8"), response, next);

  assert.equal(response.statusCode, 429);
  assert.ok(response.headers["Retry-After"]);
});

test("tracks each IP address independently", () => {
  const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 1 });
  const next = () => {};

  const responseA1 = mockResponse();
  limiter(mockRequest("10.0.0.1"), responseA1, next);
  const responseB1 = mockResponse();
  limiter(mockRequest("10.0.0.2"), responseB1, next);

  assert.equal(responseA1.statusCode, null, "first request from IP A should pass");
  assert.equal(responseB1.statusCode, null, "first request from a different IP should also pass");
});

test("reset() clears tracked hits", () => {
  const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 1 });
  const next = () => {};

  limiter(mockRequest("9.9.9.9"), mockResponse(), next);
  limiter.reset();
  const response = mockResponse();
  limiter(mockRequest("9.9.9.9"), response, next);

  assert.equal(response.statusCode, null, "request after reset should pass again");
});
