"use strict";

const { Resend } = require("resend");

class ResendEmailProvider {
constructor(apiKey = process.env.EMAIL_PROVIDER_API_KEY) {
if (!apiKey) {
throw new Error("EMAIL_PROVIDER_API_KEY is required when EMAIL_PROVIDER=resend.");
}
this.client = new Resend(apiKey);
}

async send(message) {
const { data, error } = await this.client.emails.send({
from: message.from,
to: message.to,
subject: message.subject,
text: message.text,
html: message.html
});

if (error) {
throw new Error(
`Resend email delivery failed: ${error.message || "Unknown Resend error"}`
);
}

return {
sent: true,
provider: "resend",
detail: data && data.id
? `Accepted by Resend (message id: ${data.id}).`
: "Accepted by Resend."
};
}
}

module.exports = { ResendEmailProvider };