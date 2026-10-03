"use strict";

const { ConsoleSmsProvider } = require("./consoleSmsProvider");

function getSmsProvider(config) {
  switch ((config.sms && config.sms.provider) || "console") {
    case "console":
      return new ConsoleSmsProvider();
    default:
      throw new Error(`Unsupported SMS provider: ${config.sms.provider}`);
  }
}

function renderBulletinReplySms(details, config) {
  const url = `${config.publicBaseUrl}/community/member/bulletin-board/post/${encodeURIComponent(details.postId)}/`;
  return {
    to: details.phone,
    text: `${details.replierName} replied to your Open Door Design Community Bulletin Board post. Read it: ${url}`
  };
}

async function sendBulletinReplySms(provider, details, config) {
  return provider.send(renderBulletinReplySms(details, config));
}

module.exports = { getSmsProvider, renderBulletinReplySms, sendBulletinReplySms };
