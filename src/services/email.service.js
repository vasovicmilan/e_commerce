// services/email.service.js
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import { sendEmail } from "../integrations/email/email.provider.js";
import { mapOrderToPdfModel } from "../mappers/order.mapper.js";
import { logInfo, logError } from "../utils/logger.util.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_PATH = path.join(__dirname, "..", "views", "emails");

const BASE_URL = process.env.BASE_URL || "https://www.tophelanke.com";
const SITE_NAME = process.env.SITE_NAME || "TopHelanke";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "podrska@tophelanke.com";

/**
 * Renderuje EJS šablon sa opcijom da se isključi keširanje.
 */
import fs from 'fs';

async function renderTemplate(templateName, data) {
  try {
    const templatePath = path.join(TEMPLATES_PATH, `${templateName}.ejs`);

    const templateContent = fs.readFileSync(templatePath, 'utf8');

    const html = ejs.render(
      templateContent,
      {
        ...data,
        BASE_URL,
        SITE_NAME,
        SUPPORT_EMAIL,
        currentYear: new Date().getFullYear(),
      },
      {
        cache: false,
        filename: templatePath,   // važno za include
        root: TEMPLATES_PATH,     // važno za include
      }
    );

    return html;
  } catch (error) {
    logError(`[EMAIL] Template error (${templateName})`, error);
    throw error;
  }
}

export async function sendAccountConfirmationEmail(user, confirmToken) {
  const html = await renderTemplate("account-confirmation", {
    firstName: user.firstName,
    email: user.email,
    confirmToken,
    confirmationUrl: `${BASE_URL}/auth/verifikacija/${confirmToken}`,
  });

  return sendEmail({
    to: user.email,
    subject: `Dobrodošli u ${SITE_NAME} - Potvrdite vaš nalog`,
    html,
  });
}

export async function sendWelcomeEmailWithCoupon(user, coupon) {
  const html = await renderTemplate("welcome-coupon", {
    firstName: user.firstName,
    email: user.email,
    couponCode: coupon.code || coupon.osnovno?.kod,
    discountValue: coupon.discountValue || coupon.osnovno?.vrednost,
    discountType: coupon.discountType || coupon.osnovno?.tipRaw,
    formatDiscount:
      (coupon.discountType || coupon.osnovno?.tipRaw) === "percentage"
        ? `${coupon.discountValue || coupon.osnovno?.vrednost}%`
        : `${coupon.discountValue || coupon.osnovno?.vrednost} RSD`,
    validUntil: coupon.validUntil || coupon.važenje?.važiDo,
    shopUrl: `${BASE_URL}/prodavnica`,
  });

  return sendEmail({
    to: user.email,
    subject: `Dobrodošli u ${SITE_NAME} - Vaš poklon kupon je unutra! 🎁`,
    html,
  });
}

export async function sendPasswordResetEmail(user, resetToken) {
  const html = await renderTemplate("password-reset", {
    firstName: user.firstName,
    email: user.email,
    resetToken,
    resetUrl: `${BASE_URL}/auth/nova-lozinka?token=${resetToken}`,
  });

  return sendEmail({
    to: user.email,
    subject: `Reset lozinke - ${SITE_NAME}`,
    html,
  });
}

export async function sendPasswordChangedEmail(user) {
  const html = await renderTemplate("password-changed", {
    firstName: user.firstName,
    email: user.email,
  });

  return sendEmail({
    to: user.email,
    subject: `Lozinka je uspešno promenjena - ${SITE_NAME}`,
    html,
  });
}

export async function sendAccountDeactivatedEmail(user) {
  const html = await renderTemplate("account-deactivated", {
    firstName: user.firstName,
    email: user.email,
  });

  return sendEmail({
    to: user.email,
    subject: `Nalog je deaktiviran - ${SITE_NAME}`,
    html,
  });
}

export async function sendOrderConfirmationEmail(user, rawOrder, pdfBuffer = null) {
  const order = mapOrderToPdfModel(rawOrder);

  const orderId = rawOrder.id || rawOrder._id;
  const shortId = orderId ? String(orderId).slice(-6) : "";

  const html = await renderTemplate("order-confirmation", {
    firstName: user.firstName,
    email: user.email,
    order,
    orderUrl: `${BASE_URL}/profil/porudzbine/${rawOrder.id || rawOrder._id}`,
    cancelUrl: `${BASE_URL}/porudzbina/otkazi?token=${rawOrder.cancelToken}`,
  });

  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `porudzbina-${shortId}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    });
  }

  return sendEmail({
    to: user.email,
    subject: `Porudžbina #${shortId} je potvrđena - ${SITE_NAME}`,
    html,
    attachments,
  });
}

export async function sendOrderStatusUpdateEmail(user, rawOrder) {
  const order = mapOrderToPdfModel(rawOrder);

  const orderId = rawOrder.id || rawOrder._id;
  const shortId = orderId ? String(orderId).slice(-6) : "";

  const html = await renderTemplate("order-status-update", {
    firstName: user.firstName,
    email: user.email,
    order,
    orderUrl: `${BASE_URL}/profil/porudzbine/${rawOrder.id || rawOrder._id}`,
  });

  return sendEmail({
    to: user.email,
    subject: `Status porudžbine #${shortId} je promenjen - ${SITE_NAME}`,
    html,
  });
}

export async function sendOrderCancelledEmail(user, rawOrder) {
  const order = mapOrderToPdfModel(rawOrder);

  const orderId = rawOrder.id || rawOrder._id;
  const shortId = orderId ? String(orderId).slice(-6) : "";

  const html = await renderTemplate("order-cancelled", {
    firstName: user.firstName,
    email: user.email,
    order,
  });

  return sendEmail({
    to: user.email,
    subject: `Porudžbina #${shortId} je otkazana - ${SITE_NAME}`,
    html,
  });
}

export async function sendOrderTokenEmail(user, tempOrder) {
  const html = await renderTemplate("order-token", {
    firstName: user.firstName,
    email: user.email,
    verificationToken: tempOrder.verificationToken,
    tokenExpiration: tempOrder.tokenExpiration,
    confirmUrl: `${BASE_URL}/porudzbina/potvrdi?token=${tempOrder.verificationToken}&orderId=${tempOrder.id || tempOrder._id}`,
  });

  return sendEmail({
    to: user.email,
    subject: `Potvrdite vašu porudžbinu - ${SITE_NAME}`,
    html,
  });
}

export async function notifyAdminNewOrder(rawOrder, pdfBuffer = null) {
  const order = mapOrderToPdfModel(rawOrder);
  const adminEmail = process.env.ADMIN_EMAIL || SUPPORT_EMAIL;

  const orderId = rawOrder.id || rawOrder._id;
  const shortId = orderId ? String(orderId).slice(-6) : "";

  const html = await renderTemplate("admin-new-order", {
    order,
    adminUrl: `${BASE_URL}/admin/porudzbine/detalji/${rawOrder.id || rawOrder._id}`,
  });

  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `porudzbina-${shortId}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    });
  }

  return sendEmail({
    to: adminEmail,
    subject: `Nova porudžbina #${shortId} - ${SITE_NAME}`,
    html,
    attachments,
  });
}

export async function notifyAdminOrderCancelled(rawOrder) {
  const order = mapOrderToPdfModel(rawOrder);
  const adminEmail = process.env.ADMIN_EMAIL || SUPPORT_EMAIL;

  const orderId = rawOrder.id || rawOrder._id;
  const shortId = orderId ? String(orderId).slice(-6) : "";

  const html = await renderTemplate("admin-order-cancelled", {
    order,
    adminUrl: `${BASE_URL}/admin/porudzbine/detalji/${rawOrder.id || rawOrder._id}`,
  });

  return sendEmail({
    to: adminEmail,
    subject: `Porudžbina #${shortId} je otkazana - ${SITE_NAME}`,
    html,
  });
}

export async function notifyAdminLowStock(item) {
  const adminEmail = process.env.ADMIN_EMAIL || SUPPORT_EMAIL;
  const html = await renderTemplate("admin-low-stock", {
    item,
    adminUrl: `${BASE_URL}/admin/artikli/detalji/${item.id}`,
  });

  return sendEmail({
    to: adminEmail,
    subject: `Nisko stanje: ${item.title || item.naziv} - ${SITE_NAME}`,
    html,
  });
}

export async function notifyAdminOutOfStock(item) {
  const adminEmail = process.env.ADMIN_EMAIL || SUPPORT_EMAIL;
  const html = await renderTemplate("admin-out-of-stock", {
    item,
    adminUrl: `${BASE_URL}/admin/artikli/detalji/${item.id}`,
  });

  return sendEmail({
    to: adminEmail,
    subject: `Nema na stanju: ${item.title || item.naziv} - ${SITE_NAME}`,
    html,
  });
}

export async function notifyAdminNewContact(contact) {
  const adminEmail = process.env.ADMIN_EMAIL || SUPPORT_EMAIL;
  const html = await renderTemplate("admin-new-contact", {
    contact,
    adminUrl: `${BASE_URL}/admin/kontakt/detalji/${contact.id}`,
  });

  return sendEmail({
    to: adminEmail,
    subject: `Nova kontakt poruka od ${contact.firstName || contact.ime} - ${SITE_NAME}`,
    html,
  });
}

export async function sendNewsletterWelcomeEmail(subscriber) {
  const html = await renderTemplate("newsletter-welcome", {
    firstName: subscriber.firstName || "",
    email: subscriber.email,
    unsubscribeUrl: `${BASE_URL}/newsletter/odjava?email=${encodeURIComponent(subscriber.email)}`,
  });

  return sendEmail({
    to: subscriber.email,
    subject: `Uspešno ste prijavljeni na newsletter - ${SITE_NAME}`,
    html,
  });
}

export async function sendNewsletterCampaign(subscribers, campaign) {
  const results = [];
  for (const subscriber of subscribers) {
    const html = await renderTemplate("newsletter-campaign", {
      firstName: subscriber.firstName || "",
      email: subscriber.email,
      campaign,
      unsubscribeUrl: `${BASE_URL}/newsletter/odjava?email=${encodeURIComponent(subscriber.email)}`,
    });

    try {
      const result = await sendEmail({
        to: subscriber.email,
        subject: campaign.subject,
        html,
      });
      results.push({ email: subscriber.email, sent: true, messageId: result.messageId });
    } catch (error) {
      results.push({ email: subscriber.email, sent: false, error: error.message });
    }
  }
  return results;
}

export default {
  sendAccountConfirmationEmail,
  sendWelcomeEmailWithCoupon,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendAccountDeactivatedEmail,

  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendOrderCancelledEmail,
  sendOrderTokenEmail,

  notifyAdminNewOrder,
  notifyAdminOrderCancelled,
  notifyAdminLowStock,
  notifyAdminOutOfStock,
  notifyAdminNewContact,

  sendNewsletterWelcomeEmail,
  sendNewsletterCampaign,
};