"use strict";

class ConsoleSmsProvider {
  async send(message) {
    console.log("\n[sms:console] Development provider only - no text was actually sent.");
    console.log(`To: ${message.to}`);
    console.log(message.text);
    return { sent: false, provider: "console", detail: "Development provider only; no SMS delivered." };
  }
}

module.exports = { ConsoleSmsProvider };
