import nodemailer from "nodemailer";

function parseBody(body) {
  if (!body) return {};

  // Try JSON first
  try {
    return JSON.parse(body);
  } catch (e) {
    // Fallback: assume application/x-www-form-urlencoded from a HTML <form>
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
    // Support both JSON and normal form posts
    const data = parseBody(event.body || "");
    const formName =
      data["form-name"] ||
      data.formName ||
      "StashIt form";

    if (!data || Object.keys(data).length === 0) {
      console.warn("email.js: no data in body");
    }

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
