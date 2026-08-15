"use strict";

const { ConsoleEmailProvider } = require("./consoleEmailProvider");
const { ResendEmailProvider } = require("./resendEmailProvider");
const { renderConfirmationEmail } = require("./templates/confirmationEmail");

/**
 * Selects the active email provider based on configuration. This is the
 * single place a provider is chosen, mirroring storage/index.js for the
 * registration store. "console" (the default) is the only implemented
 * provider today — see consoleEmailProvider.js and emailProvider.js for how
 * a real provider would be added here later without changing any calling
 * code.
 *
 * @param {ReturnType<import("../config").readConfig>} config
 */
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

/**
 * Sends the registration confirmation email through the given provider.
 * Failure handling is the caller's responsibility (see server.js): a
 * failure here must never undo a successful registration, since storage
 * already succeeded by the time this is called.
 *
 * @param {{ send(message: object): Promise<object> }} provider
 * @param {{ firstName: string, email: string }} member
 * @param {object} config
 */
async function sendConfirmationEmail(provider, member, config) {
  const message = renderConfirmationEmail(member, config);
  return provider.send(message);
}

module.exports = { getEmailProvider, sendConfirmationEmail };
