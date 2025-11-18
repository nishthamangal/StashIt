// netlify/functions/emails.js

import nodemailer from "nodemailer";

// Parse either JSON (for tests) or URL-encoded form data (real browser forms)
function parseBody(body) {
  if (!body) return {};

  // Try JSON first
  try {
    return JSON.parse(body);
  } catch (e) {
    // Fallback: treat as application/x-www-form-urlencoded
    const params = new URLSearchParams(body);
    const result = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  }
}

export const handler = async (event) => {
  try {
    const data = parseBody(event.body || "");

    const formName =
      data["form-name"] ||
      data.form_name ||
      data.formName ||
      "StashIt form";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Email to you
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: "info@stashitvault.com",
      subject: `New ${formName} submission`,
      text: JSON.stringify(data, null, 2),
    });

    // Email to the submitter (if they entered an email)
    if (data.email) {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: data.email,
        subject: "Thanks for contacting StashIt!",
        text:
          "We received your submission and will be in touch soon.\n\n" +
          "Here’s a copy of what you sent:\n\n" +
          JSON.stringify(data, null, 2),
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Emails sent successfully!" }),
    };
  } catch (err) {
    console.error("Email Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Email failed." }),
    };
  }
};
