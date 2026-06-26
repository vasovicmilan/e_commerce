import { decrypt } from "../services/crypto.service.js";
import { formatDateTime, formatDate } from "../utils/date.time.util.js";

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

function translateStatus(status) {
  const map = {
    pending: "Na čekanju",
    confirmed: "Potvrđena",
    processing: "U obradi",
    shipped: "Poslata",
    delivered: "Isporučena",
    completed: "Završena",        // ✅ dodato
    cancelled: "Otkazana",
    returned: "Vraćena",
    refunded: "Refundirana",
    failed: "Neuspešna",
  };
  return map[status] || status;
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

export function mapOrdersForAdminList(orders = []) {
  return orders.map((order) => {
    if (!order) return null;
    return {
      id: order._id.toString(),
      kupac: `${order.buyerInfo.firstName} ${order.buyerInfo.lastName}`,
      email: order.buyerInfo.email,
      tipKupca: order.buyerModel === "User" ? "Korisnik" : "Kupac",
      brojStavki: order.items?.length || 0,
      ukupno: `${order.totalPrice} RSD`,
      status: translateStatus(order.status),
      statusRaw: order.status,
      grad: order.address?.city || "",
      partner: order.partner?.partnerId ? translateSource(order.partner.source) : null,
      kreiran: formatDate(order.createdAt),
    };
  }).filter(Boolean);
}

export function mapOrderForAdminDetail(order) {
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
    status: {
      trenutni: translateStatus(order.status),
      trenutniRaw: order.status,
      potvrđena: order.confirmedAt ? formatDateTime(order.confirmedAt) : null,
      poslata: order.shippedAt ? formatDateTime(order.shippedAt) : null,
      isporučena: order.deliveredAt ? formatDateTime(order.deliveredAt) : null,
      završena: order.completedAt ? formatDateTime(order.completedAt) : null,   // ✅ dodato
      otkazana: order.cancelledAt ? formatDateTime(order.cancelledAt) : null,
    },
    napomena: decryptNote(order.note),
    cancelToken: order.cancelToken || null,
    temporaryOrderId: order.temporaryOrderId?.toString() || null,
    vreme: {
      kreirano: formatDateTime(order.createdAt),
      ažurirano: formatDateTime(order.updatedAt),
    },
  };
}

export function mapOrderForCustomer(order) {
  if (!order) return null;

  return {
    id: order._id.toString(),
    status: translateStatus(order.status),
    statusRaw: order.status,
    stavke: (order.items || []).map((item) => ({
      naziv: item.title,
      velicina: item.size,
      boja: item.color,
      cena: item.price,
      kolicina: item.quantity,
      slika: item.image?.img || null,
    })),
    ukupno: `${order.totalPrice} RSD`,
    adresa: decryptAddress(order.address),
    kreirano: formatDate(order.createdAt),
  };
}

export function mapOrdersForCustomer(orders = []) {
  return orders.map(mapOrderForCustomer).filter(Boolean);
}

export function mapOrderToPdfModel(order) {
  if (!order) return null;

  const address = decryptAddress(order.address);
  const telephone = decryptTelephone(order.telephone);

  return {
    id: order._id?.toString() || order.id,
    orderNumber: order._id?.toString()?.slice(-6) || order.id?.slice(-6) || "",
    date: order.createdAt || order.confirmedAt || new Date(),
    status: translateStatus(order.status),
    buyer: {
      firstName: order.buyerInfo?.firstName || "",
      lastName: order.buyerInfo?.lastName || "",
      email: order.buyerInfo?.email || "",
      phone: telephone?.value || "",
    },
    address: {
      street: address?.street || "",
      city: address?.city || "",
      postalCode: address?.postalCode || "",
      country: "Srbija",
    },
    items: (order.items || []).map((item) => ({
      title: item.title || "",
      color: item.color || "",
      size: item.size || "",
      quantity: item.quantity || 0,
      price: item.price || 0,
      image: item.image?.img || null,
    })),
    subtotal: order.subtotal || 0,
    shipping: order.shipping || 0,
    coupon: order.coupon
      ? {
          code: order.coupon.code || "",
          discount: order.coupon.discount || 0,
        }
      : null,
    totalPrice: order.totalPrice || 0,
    total: order.totalPrice || 0,
    note: decryptNote(order.note),
    cancelToken: order.cancelToken || null,
  };
}

export function mapOrderRaw(order) {
  return order;
}

export default {
  mapOrdersForAdminList,
  mapOrderForAdminDetail,
  mapOrderForCustomer,
  mapOrdersForCustomer,
  mapOrderToPdfModel,
  mapOrderRaw,
};