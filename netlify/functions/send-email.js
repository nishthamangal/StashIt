// netlify/functions/send-email.js

const nodemailer = require("nodemailer");

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

exports.handler = async (event) => {
  try {
    let payload;

    // Netlify form event (submission-created)
    if (event.headers && event.headers["x-netlify-event"] === "submission-created") {
      const body = JSON.parse(event.body);
      payload = body.payload || body;
    }
    // Direct test call via POST /.netlify/functions/send-email
    else if (event.httpMethod === "POST") {
      payload = JSON.parse(event.body);
    } else {
      // Ignore other calls
      return {
        statusCode: 200,
        body: "OK",
      };
    }

    const data = payload.data || payload;
    const formName =
      payload.form_name ||
      data.formName ||
      data.form_name ||
      "StashIt Form";

    const submitterEmail = data.email;

    // Build a simple text summary of all fields (except spam/captcha)
    const lines = Object.keys(data)
      .filter(
        (key) =>
          ![
            "g-recaptcha-response",
            "bot-field",
            "form-name",
            "form_name",
          ].includes(key)
      )
      .map((key) => `${key}: ${data[key]}`);

    const summaryText = lines.join("\n");

    // 1) Email to you (info@stashitvault.com)
    await transporter.sendMail({
      from: `"StashIt" <${GMAIL_USER}>`,
      to: "info@stashitvault.com",
      subject: `New ${formName} submission`,
      text: `New ${formName} submission:\n\n${summaryText}\n\n— Netlify Forms`,
    });

    // 2) Confirmation email to the person who filled in the form (if they gave an email)
    if (submitterEmail) {
      await transporter.sendMail({
        from: `"StashIt" <${GMAIL_USER}>`,
        to: submitterEmail,
        subject: "Thanks for contacting StashIt",
        text:
          `Hi,\n\nThanks for filling out the ${formName} on StashIt.\n` +
          `Here’s a copy of what you submitted:\n\n` +
          `${summaryText}\n\n` +
          `We’ll review it and get back to you soon.\n\n` +
          `— StashIt team`,
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error("Email function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Email failed",
        details: err.message,
      }),
    };
  }
};
