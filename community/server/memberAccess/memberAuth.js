"use strict";

const crypto = require("crypto");

function generateToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function safeHashEquals(leftHash, rightHash) {
  const left = Buffer.from(String(leftHash), "utf8");
  const right = Buffer.from(String(rightHash), "utf8");

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

module.exports = {
  generateToken,
  hashToken,
  safeHashEquals
};