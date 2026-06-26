import { decrypt } from "../services/crypto.service.js";
import { formatDateTime } from "../utils/date.time.util.js";

function decryptTelephone(telephone) {
  if (!telephone?.value) return null;
  try { return { value: decrypt(telephone.value), hash: telephone.hash }; }
  catch { return telephone; }
}

function decryptAddress(address) {
  if (!address) return null;
  try {
    return {
      city: address.city,
      street: decrypt(address.street),
      number: decrypt(address.number),
      postalCode: address.postalCode,
      hash: address.hash,
    };
  } catch { return address; }
}

function decryptNote(note) {
  if (!note) return "";
  try { return decrypt(note); }
  catch { return note; }
}

function translateSource(source) {
  const map = {
    direct: "Direktno",
    affiliate_link: "Affiliate link",
    partner_shop: "Partnerska prodavnica",
    coupon: "Kupon",
  };
  return map[source] || source;
}

export function mapTemporaryOrdersForAdminList(orders = []) {
  return orders.map((order) => {
    if (!order) return null;
    return {
      id: order._id.toString(),
      kupac: `${order.buyerInfo.firstName} ${order.buyerInfo.lastName}`,
      email: order.buyerInfo.email,
      tipKupca: order.buyerModel === "User" ? "Korisnik" : "Kupac",
      brojStavki: order.items?.length || 0,
      ukupno: `${order.totalPrice} RSD`,
      status: "Na čekanju",
      partner: order.partner?.partnerId ? translateSource(order.partner.source) : null,
      kreiran: formatDateTime(order.createdAt),
      ističe: formatDateTime(order.tokenExpiration),
    };
  }).filter(Boolean);
}

export function mapTemporaryOrderForAdminDetail(order) {
  if (!order) return null;

  return {
    id: order._id.toString(),
    kupac: {
      ime: order.buyerInfo.firstName,
      prezime: order.buyerInfo.lastName,
      email: order.buyerInfo.email,
      tip: order.buyerModel === "User" ? "Korisnik" : "Kupac",
      buyerId: order.buyerId?.toString(),
    },
    kontakt: {
      telefon: decryptTelephone(order.telephone),
      adresa: decryptAddress(order.address),
    },
    stavke: (order.items || []).map((item) => ({
      itemId: item.itemId?.toString(),
      naziv: item.title,
      varijacijaId: item.variationId?.toString(),
      velicina: item.size,
      boja: item.color,
      cena: item.price,
      kolicina: item.quantity,
      ukupno: item.price * item.quantity,
      slika: item.image?.img || null,
      affiliateCode: item.affiliateCode || null,
    })),
    finansije: {
      subtotal: order.subtotal,
      shipping: order.shipping,
      popust: order.coupon?.discount || 0,
      kuponKod: order.coupon?.code || null,
      ukupno: order.totalPrice,
    },
    partner: order.partner?.partnerId
      ? {
          partnerId: order.partner.partnerId.toString(),
          source: translateSource(order.partner.source),
          sourceRaw: order.partner.source,
        }
      : null,
    napomena: decryptNote(order.note),
    podesavanja: {
      noviNalog: order.createNewAccount || false,
      noviTelefon: order.hasNewTelephone || false,
      novaAdresa: order.hasNewAddress || false,
    },
    token: {
      vrednost: order.verificationToken,
      ističe: formatDateTime(order.tokenExpiration),
    },
    vreme: {
      kreirano: formatDateTime(order.createdAt),
      ažurirano: formatDateTime(order.updatedAt),
    },
  };
}

export function mapTemporaryOrderForMigration(order) {
  if (!order) return null;

  return {
    temporaryOrderId: order._id.toString(),
    buyerId: order.buyerId,
    buyerModel: order.buyerModel,
    buyerInfo: order.buyerInfo,
    telephone: order.telephone,
    address: order.address,
    items: order.items,
    subtotal: order.subtotal,
    shipping: order.shipping,
    coupon: order.coupon,
    partner: order.partner,
    totalPrice: order.totalPrice,
    note: order.note,
  };
}

export function mapTemporaryOrderRaw(order) {
  return order;
}

export default {
  mapTemporaryOrdersForAdminList,
  mapTemporaryOrderForAdminDetail,
  mapTemporaryOrderForMigration,
  mapTemporaryOrderRaw,
};