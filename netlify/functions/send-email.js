const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  try {
    const parsed = JSON.parse(event.body || "{}");
    const payload = parsed.payload || {};
    const data = payload.data || {};
    const formName = payload.form_name || "form";
    const submittedAt = payload.created_at || new Date().toISOString();

    const email = (data.email || "").trim();

    function line(label, key) {
      if (typeof data[key] !== "undefined" && String(data[key]).trim() !== "") {
        return `• ${label}: ${data[key]}`;
      }
      return null;
    }

    const lines = [
      line("Name", "name"),
      line("Email", "email"),
      line("Phone", "phone"),
      line("Neighbourhood", "neighbourhood"),
      line("Neighbourhood (Other)", "neighbourhood_other"),
      line("Space size", "space_size"),
      line("Budget", "budget"),
      line("Access", "access"),
      line("Start date", "start_date"),
      line("Duration", "duration"),
      line("Items", "items"),
      line("Space type", "space_type"),
      line("Space type (Other)", "space_type_other"),
      line("Approx size", "size"),
      line("Security", "security"),
      line("Climate", "climate"),
      line("Access hours", "access_hours"),
      line("Price expectation", "price_expectation"),
      line("Available from", "available_from"),
      line("Rules", "rules")
    ].filter(Boolean);

    let photoInfo = "";
    const photos = data.photos;
    if (Array.isArray(photos) && photos.length > 0) {
      photoInfo = `\nPhotos uploaded: ${photos.length}`;
    }

    const siteName = "StashIt Vault";
    const user = process.env.GMAIL_USER || "info@stashitvault.com";
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      console.warn("Email env not set (GMAIL_USER / GMAIL_APP_PASSWORD). Skipping send.");
      return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: "missing credentials" }) };
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    });

    const subject =
      formName === "host"
        ? "Thanks — we received your Host application"
        : "Thanks — we received your storage request";

    const text = `Hi ${data.name || "there"},

Thanks for contacting ${siteName}. We’ve received your "${formName}" submission (${new Date(submittedAt).toLocaleString()}). We’ll reach out shortly.

Summary:
${lines.join("\n")}${photoInfo}

If anything needs correcting, just reply to this email.

— ${siteName}
info@stashitvault.com • +1-403-614-9716
`;

    if (email) {
      await transporter.sendMail({
        from: `"${siteName}" <${user}>`,
        to: email,
        bcc: user,
        subject,
        text
      });
    } else {
      await transporter.sendMail({
        from: `"${siteName}" <${user}>`,
        to: user,
        subject: `New ${formName} submission (no email provided)`,
        text
      });
    }

    return { statusCode: 200, body: JSON.stringify({ sent: true }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 200, body: JSON.stringify({ sent: false, error: e.message }) };
  }
};
