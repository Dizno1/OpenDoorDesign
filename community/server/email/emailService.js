"use strict";

const { ConsoleEmailProvider } = require("./consoleEmailProvider");
const { ResendEmailProvider } = require("./resendEmailProvider");
const { renderConfirmationEmail } = require("./templates/confirmationEmail");
const { renderMemberSignInEmail } = require("./templates/memberSignInEmail");

function getEmailProvider(config) {
  switch (config.email.provider) {
    case "console":
      return new ConsoleEmailProvider();
    case "resend":
      return new ResendEmailProvider();
    default:
      throw new Error(`Unsupported email provider: ${config.email.provider}`);
  }
}

async function sendConfirmationEmail(provider, member, config) {
  const message = renderConfirmationEmail(member, config);
  return provider.send(message);
}

async function sendMemberSignInEmail(provider, member, signInUrl, config) {
  const message = renderMemberSignInEmail(member, signInUrl, config);
  return provider.send(message);
}

module.exports = {
  getEmailProvider,
  sendConfirmationEmail,
  sendMemberSignInEmail
};