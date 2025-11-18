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
  console.log("send-email invoked");
  console.log("httpMethod:", event.httpMethod);
  console.log("raw body (first 300 chars):", event.body ? event.body.slice(0, 300) : "no body");

  let payload;
  try {
    payload = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    console.error("Failed to parse JSON body:", e.message);
    payload = {};
  }

  let data = {};
  let formName = "StashIt Form";

  // Case 1: Netlify submission-created event: { payload: { form_name, data, ... } }
  if (payload && payload.payload && payload.payload.data) {
    const p = payload.payload;
    formName = p.form_name || formName;
    data = p.data || {};
    console.log("Detected Netlify submission-created event for form:", formName);
  }
  // Case 2: Sometimes it may be { form_name, data }
  else if (payload && payload.data) {
    formName = payload.form_name || payload.formName || formName;
    data = payload.data;
    console.log("Detected payload.data form:", formName);
  }
  // Case 3: Direct POST test: fields directly in body
  else {
    data = payload || {};
    formName =
      data.form_name ||
      data["form-name"] ||
      data.formName ||
      formName;
    console.log("Detected direct POST form:", formName);
  }

  // If we somehow didn't get any fields, bail cleanly
  if (!data || Object.keys(data).length === 0) {
    console.warn("No data found in submission, nothing to send.");
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, note: "No data in submission" }),
    };
  }

  const submitterEmail = data.email;

  // Build a summary of all fields except spam/recaptcha/meta
  const excludedKeys = [
    "g-recaptcha-response",
    "bot-field",
    "form-name",
    "form_name",
    "form-id",
    "formId",
  ];

  const lines = Object.keys(data)
    .filter((key) => !excludedKeys.includes(key))
    .map((key) => `${key}: ${data[key]}`);

  const summaryText = lines.join("\n");

  try {
    // 1) Email to you
    await transporter.sendMail({
      from: `"StashIt" <${GMAIL_USER}>`,
      to: "info@stashitvault.com",
      subject: `New ${formName} submission`,
      text:
        `You have a new ${formName} submission:\n\n` +
        `${summaryText}\n\n` +
        `— Sent automatically from Netlify Forms`,
    });
    console.log("Owner email sent to info@stashitvault.com");

    // 2) Confirmation email to submitter (if email field present)
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
      console.log("Confirmation email sent to:", submitterEmail);
    } else {
      console.log("No email field in submission; skipping confirmation email.");
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
