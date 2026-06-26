import { decrypt } from "../services/crypto.service.js";

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatPrice(price) {
  if (typeof price !== "number") return "0";
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatAddress(address) {
  if (!address) return "-";

  let city = address.city || "";
  let street = address.street || "";
  let number = address.number || "";
  let postalCode = address.postalCode || "";

  try {
    street = decrypt(street);
    number = decrypt(number);
  } catch (e) {
    // već dekriptovano
  }

  return `${street} ${number}, ${postalCode} ${city}`.trim() || "-";
}

function formatTelephone(telephone) {
  if (!telephone) return "-";

  if (telephone.value) {
    try {
      return decrypt(telephone.value);
    } catch (e) {
      return telephone.value || "-";
    }
  }

  return telephone || "-";
}

export function buildNewOrderMessage(order) {
  const items = order.items || [];
  const itemsText = items
    .map(
      (item) =>
        `• <b>${escapeHtml(item.title)}</b> - ${escapeHtml(item.size)} / ${escapeHtml(item.color)} x${item.quantity} — ${formatPrice(item.price * item.quantity)} RSD`
    )
    .join("\n");

  const buyerInfo = order.buyerInfo || {};
  const fullName = `${buyerInfo.firstName || ""} ${buyerInfo.lastName || ""}`.trim();

  return [
    `🛒 <b>Nova porudžbina #${escapeHtml((order.id || "").slice(-6))}</b>`,
    "",
    `👤 <b>Kupac:</b> ${escapeHtml(fullName)}`,
    `📧 <b>Email:</b> ${escapeHtml(buyerInfo.email || "-")}`,
    `📞 <b>Telefon:</b> ${escapeHtml(formatTelephone(order.telephone))}`,
    `🏠 <b>Adresa:</b> ${escapeHtml(formatAddress(order.address))}`,
    `💰 <b>Ukupno:</b> ${formatPrice(order.totalPrice)} RSD`,
    "",
    `📦 <b>Proizvodi:</b>`,
    itemsText,
    order.note ? `\n📝 <b>Napomena:</b> ${escapeHtml(order.note)}` : "",
    order.partner?.partnerId ? `\n🔗 <b>Partner:</b> ${escapeHtml(order.partner.source)}` : "",
  ].join("\n");
}

export function buildCancelledOrderMessage(order) {
  const base = buildNewOrderMessage(order);
  return base.replace("🛒 <b>Nova porudžbina", "❌ <b>Porudžbina otkazana");
}

export function buildStatusChangeMessage(order, oldStatus, newStatus) {
  const buyerInfo = order.buyerInfo || {};
  const fullName = `${buyerInfo.firstName || ""} ${buyerInfo.lastName || ""}`.trim();

  return [
    `🔄 <b>Status porudžbine promenjen</b>`,
    "",
    `📦 <b>Porudžbina:</b> #${escapeHtml((order.id || "").slice(-6))}`,
    `👤 <b>Kupac:</b> ${escapeHtml(fullName)}`,
    `📊 <b>Status:</b> ${escapeHtml(oldStatus)} → <b>${escapeHtml(newStatus)}</b>`,
    `💰 <b>Ukupno:</b> ${formatPrice(order.totalPrice)} RSD`,
  ].join("\n");
}

export function buildNewContactMessage(contact) {
  return [
    `📩 <b>Nova kontakt poruka</b>`,
    "",
    `👤 <b>Ime:</b> ${escapeHtml(contact.firstName || contact.ime || "-")}`,
    `📧 <b>Email:</b> ${escapeHtml(contact.email || "-")}`,
    `📋 <b>Naslov:</b> ${escapeHtml(contact.title || "-")}`,
    `💬 <b>Poruka:</b> ${escapeHtml((contact.message || contact.komentar || "").substring(0, 200))}`,
  ].join("\n");
}

export function buildNewTestimonialMessage(testimonial) {
  return [
    `⭐ <b>Novi testimonial - čeka odobrenje</b>`,
    "",
    `👤 <b>Ime:</b> ${escapeHtml(testimonial.displayName || testimonial.ime || "-")}`,
    `📧 <b>Email:</b> ${escapeHtml(testimonial.email || "-")}`,
    `⭐ <b>Ocena:</b> ${"★".repeat(testimonial.rating || 0)}${"☆".repeat(5 - (testimonial.rating || 0))}`,
    `📋 <b>Naslov:</b> ${escapeHtml(testimonial.title || "-")}`,
    `💬 <b>Komentar:</b> ${escapeHtml((testimonial.comment || "").substring(0, 200))}`,
  ].join("\n");
}

export function buildLowStockMessage(item) {
  return [
    `⚠️ <b>Nisko stanje</b>`,
    "",
    `📦 <b>Artikal:</b> ${escapeHtml(item.title || item.naziv || "-")}`,
    `🔢 <b>SKU:</b> ${escapeHtml(item.sku || "-")}`,
    `📊 <b>Preostalo:</b> ${item.amount || item.kolicina || 0} kom.`,
    item.variationId ? `📏 <b>Varijacija:</b> ${escapeHtml(item.size || "")} / ${escapeHtml(item.color || "")}` : "",
  ].join("\n");
}

export function buildOutOfStockMessage(item) {
  return [
    `🚫 <b>Nema na stanju!</b>`,
    "",
    `📦 <b>Artikal:</b> ${escapeHtml(item.title || item.naziv || "-")}`,
    `🔢 <b>SKU:</b> ${escapeHtml(item.sku || "-")}`,
    item.variationId ? `📏 <b>Varijacija:</b> ${escapeHtml(item.size || "")} / ${escapeHtml(item.color || "")}` : "",
  ].join("\n");
}

export function buildNewUserMessage(user) {
  return [
    `👤 <b>Nova registracija</b>`,
    "",
    `📧 <b>Email:</b> ${escapeHtml(user.email || "-")}`,
    `👤 <b>Ime:</b> ${escapeHtml(`${user.firstName || ""} ${user.lastName || ""}`.trim())}`,
    `🔑 <b>Provider:</b> ${escapeHtml(user.provider || "local")}`,
  ].join("\n");
}