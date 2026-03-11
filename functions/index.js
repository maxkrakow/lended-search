const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const fetch = require("node-fetch");

const WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/jt2cla2yKK13pavtLwNJ/webhook-trigger/45403cb3-0073-454b-be90-370bb944c426";

const DELAY_MS = 5 * 60 * 1000; // 5 minutes

exports.textNewLead = onDocumentCreated("leads/{leadId}", async (event) => {
  const lead = event.data.data();

  if (!lead || !lead.phone) {
    logger.info("No phone number on lead, skipping text.");
    return;
  }

  // Wait 5 minutes
  logger.info(`Waiting 5 minutes before texting lead: ${lead.name || "unknown"}`);
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  // Name is already first name only, fullName has the complete name
  const firstName = lead.name || "";
  const fullName = lead.fullName || lead.name || "";
  const nameParts = fullName.trim().split(/\s+/);
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  const payload = {
    firstName,
    lastName,
    fullName,
    phone: lead.phone,
    email: lead.email || "",
    source: lead.source || "lander",
    current_search: lead.current_search || "",
    deal_size: lead.deal_size || "",
    industry: lead.industry || "",
    liquid_cash: lead.liquid_cash || "",
    location: lead.location || "",
    motivation: lead.motivation || "",
    program: lead.program || "",
    readiness: lead.readiness || "",
    searcher_type: lead.searcher_type || "",
    target_revenue: lead.target_revenue || "",
    target_sde: lead.target_sde || "",
    us_resident: lead.us_resident || "",
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      logger.info(`Webhook sent successfully for lead: ${lead.name}`);
    } else {
      logger.error(`Webhook failed with status ${response.status}: ${await response.text()}`);
    }
  } catch (err) {
    logger.error("Error sending webhook:", err);
  }
});
