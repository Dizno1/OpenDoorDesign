"use strict";

const { hashToken } = require("./memberAuth");

function parseCookies(cookieHeader) {
  const cookies = {};

  String(cookieHeader || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const separatorIndex = part.indexOf("=");

      if (separatorIndex <= 0) {
        return;
      }

      const name = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();

      cookies[name] = decodeURIComponent(value);
    });

  return cookies;
}

function getSessionFromRequest(request, memberStore, cookieName) {
  const cookies = parseCookies(request.headers.cookie);
  const rawSessionToken = cookies[cookieName];

  if (!rawSessionToken) {
    return null;
  }

  const sessionTokenHash = hashToken(rawSessionToken);

  return memberStore.findActiveSession(sessionTokenHash);
}

module.exports = {
  parseCookies,
  getSessionFromRequest
};