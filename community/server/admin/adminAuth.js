"use strict";

function parseBasicAuthorization(headerValue) {
  if (!headerValue || !headerValue.startsWith("Basic ")) {
    return null;
  }

  const encoded = headerValue.slice("Basic ".length).trim();

  let decoded;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch (error) {
    return null;
  }

  const separatorIndex = decoded.indexOf(":");

  if (separatorIndex < 0) {
    return null;
  }

  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1)
  };
}

function createAdminAuthMiddleware(config) {
  const username = config.admin && config.admin.username;
  const password = config.admin && config.admin.password;

  if (!username || !password) {
    throw new Error(
      "ADMIN_USERNAME and ADMIN_PASSWORD are required before the Community admin area can be enabled."
    );
  }

  return function adminAuth(request, response, next) {
    const credentials = parseBasicAuthorization(
      request.headers.authorization
    );

    if (
      !credentials ||
      credentials.username !== username ||
      credentials.password !== password
    ) {
      response.set(
        "WWW-Authenticate",
        'Basic realm="Open Door Design Community Administration", charset="UTF-8"'
      );

      response
        .status(401)
        .type("text")
        .send("Authentication required.");

      return;
    }

    next();
  };
}

module.exports = {
  createAdminAuthMiddleware
};