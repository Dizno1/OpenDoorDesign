"use strict";

/**
 * Development email provider (Feature 003, Phase 4).
 *
 * Logs what would have been sent and returns { sent: false }. This is the
 * default and only implemented provider today. It exists so the
 * registration workflow can be built, tested, and demonstrated end to end
 * without requiring a commercial email account, and so nothing in the
 * codebase ever silently pretends an email was delivered when it was not.
 */
class ConsoleEmailProvider {
  async send(message) {
    // eslint-disable-next-line no-console
    console.log(
      `[email:console] Development provider only — no message was actually sent.\n` +
      `  To: ${message.to}\n` +
      `  From: ${message.from}\n` +
      `  Subject: ${message.subject}`
    );
    return {
      sent: false,
      provider: "console",
      detail: "Development provider only logs the intended email; no message is delivered."
    };
  }
}

module.exports = { ConsoleEmailProvider };
