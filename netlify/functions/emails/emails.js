import nodemailer from "nodemailer";

export const handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const formName = data["form-name"];

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
        text: "We received your submission and will be in touch soon.",
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
