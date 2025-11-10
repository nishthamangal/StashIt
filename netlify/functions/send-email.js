// netlify/functions/send-email.js
const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  try {
    // Support BOTH:
    // 1) Netlify event trigger (submission-created): event.body = {"payload":{...}}
    // 2) Direct HTTP POST to the function: event.body = {...}
    const parsed = JSON.parse(event.body || "{}");
    const payload = parsed.payload || parsed; // prefer payload if present
    const data = payload.data || payload;     // form fields live here
    const formName = payload.form_name || data["form-name"] || "form";
    const submittedAt = payload.created_at || new Date().toISOString();

    const submitterEmail = (data.email || "").trim();
    const siteName = "StashIt";

    // Build a readable summary (works for both renter & host)
    function line(label, key) {
      const v = data[key];
      if (typeof v !== "undefined" && String(v).trim() !== "") {
        return `• ${label}: ${v}`;
      }
      return null;
    }

    const lines = [
      line("Name", "name"),
      line("Email", "email"),
      line("Phone", "phone"),
      line("Neighbourhood", "neighbourhood"),
      line("Neighbourhood (Other)", "neighbourhood_other"),
      // Renter-oriented fields
      line("Space needed", "space_size"),
      line("Space (Other)", "space_size_other"),
      line("Budget", "budget"),
      line("Access", "access"),
      line("Start date", "start_date"),
      line("Duration", "duration"),
      line("Items", "items"),
      // Host-oriented fields
      line("Space type", "space_type"),
      line("Space type (Other)", "space_type_other"),
      line("Approx size", "size"),
      line("Security", "security"),
      line("Climate", "climate"),
      line("Access hours", "access_hours"),
      line("Price expectation", "price_expectation"),
      line("Available from", "available_from"),
      line("Rules", "rules"),
    ].filter(Boolean);

    // Photo count info (Netlify stores uploads with the submission)
    let photoInfo = "";
    const photos = data.photos;
    if (Array.isArray(photos) && photos.length > 0) {
      photoInfo = `\nPhotos uploaded: ${photos.length}`;
    }

    // Email creds from Netlify env vars
    const user = process.env.GMAIL_USER || "info@stashitvault.com";
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
      console.warn("Missing GMAIL_USER or GMAIL_APP_PASSWORD");
      return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: "missing credentials" }) };
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    // Subject/body differ a bit by form
    const subject =
      formName === "host"
        ? "Thanks — we received your Host application (StashIt Vault)"
        : formName === "renter"
        ? "Thanks — we received your storage request (StashIt Vault)"
        : "Thanks — we received your submission (StashIt Vault)";

    const text = `Hi ${data.name || "there"},

Thanks for contacting ${siteName}. We’ve received your "${formName}" submission (${new Date(submittedAt).toLocaleString()}). We’ll reach out shortly.

Summary:
${lines.join("\n")}${photoInfo}

If anything needs correcting, just reply to this email.

— ${siteName}
info@stashitvault.com • +1-403-614-9716
`;

    // If the submitter gave an email, send it to them and BCC you.
    // If not, at least notify you.
    if (submitterEmail) {
      await transporter.sendMail({
        from: `"${siteName}" <${user}>`,
        to: submitterEmail,
        bcc: user,
        subject,
        text,
      });
    } else {
      await transporter.sendMail({
        from: `"${siteName}" <${user}>`,
        to: user,
        subject: `New ${formName} submission (no email provided)`,
        text,
      });
    }

    return { statusCode: 200, body: JSON.stringify({ sent: true }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 200, body: JSON.stringify({ sent: false, error: e.message }) };
  }
};
