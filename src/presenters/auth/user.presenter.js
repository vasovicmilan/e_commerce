// presenter/user/user.presenter.js

function formatDate(date) {
  if (!date) return "Nepoznato";
  const d = new Date(date);
  return d.toLocaleDateString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return "Nepoznato";
  const d = new Date(date);
  return d.toLocaleString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadgeClass(status) {
  const map = {
    pending: "warning",
    confirmed: "info",
    processing: "primary",
    shipped: "info",
    delivered: "success",
    completed: "success",
    cancelled: "danger",
    returned: "secondary",
    refunded: "secondary",
    failed: "danger",
  };
  return map[status] || "secondary";
}

function getStatusLabel(status) {
  const map = {
    pending: "Na čekanju",
    confirmed: "Potvrđena",
    processing: "U obradi",
    shipped: "Poslata",
    delivered: "Isporučena",
    completed: "Završena",
    cancelled: "Otkazana",
    returned: "Vraćena",
    refunded: "Refundirana",
    failed: "Neuspešna",
  };
  return map[status] || status;
}

// ============================================================
//  PROFIL
// ============================================================

export function prepareProfileData(user) {
  if (!user) return {};

  // ✅ Map orders with status badges
  const orders = (user.porudzbine || []).map(order => ({
    id: order.id,
    status: order.status,
    ukupno: order.ukupno || order.totalPrice || 0,
    kreirana: order.kreirana || order.createdAt || null,
    statusBadge: getStatusBadgeClass(order.status),
    statusLabel: getStatusLabel(order.status),
  }));

  return {
    user: {
      id: user.id,
      email: user.osnovno.email,
      firstName: user.osnovno.ime,
      lastName: user.osnovno.prezime,
      fullName: `${user.osnovno.ime} ${user.osnovno.prezime}`.trim(),
      avatar: user.osnovno.avatar || null,
      provider: user.osnovno.provider,
      role: user.osnovno.rola,
      osnovno: user.osnovno, // keep original for fallback
    },
    telephones: user.kontakt?.telefoni || [],
    addresses: user.kontakt?.adrese || [],
    orders: orders, // ✅ glavni ključ za porudžbine
    partner: user.partner || null,
    vreme: user.vreme || {},
    formData: {},
    errors: {},
    messages: [],
  };
}

export function prepareProfileDataWithErrors(user, errors, formData) {
  const data = prepareProfileData(user);
  data.errors = errors || {};
  data.formData = formData || {};
  return data;
}

// ============================================================
//  PORUDŽBINE (lista)
// ============================================================

export function prepareOrdersData(result) {
  const orders = (result.data || []).map(order => ({
    ...order,
    statusBadge: getStatusBadgeClass(order.statusRaw || order.status),
    statusLabel: getStatusLabel(order.statusRaw || order.status),
  }));

  return {
    orders: orders,
    pagination: {
      currentPage: result.page || 1,
      totalPages: result.totalPages || 1,
      total: result.total || 0,
    },
  };
}

// ============================================================
//  DETALJI PORUDŽBINE
// ============================================================

export function prepareOrderDetailsData(order) {
  if (!order) return {};

  return {
    id: order.id,
    status: order.status,
    statusRaw: order.statusRaw,
    statusBadge: getStatusBadgeClass(order.statusRaw),
    statusLabel: getStatusLabel(order.statusRaw),
    items: order.stavke || [],
    total: order.ukupno || "0 RSD",
    address: order.adresa || null,
    createdAt: order.kreirano || "Nepoznato",
  };
}

// ============================================================
//  LISTA ŽELJA
// ============================================================

export function prepareWishlistData(result) {
  const items = (result.data || []).map(item => ({
    id: item.id,
    naziv: item.naziv || item.title,
    cena: item.cena || item.ukupno || "0 RSD",
    ukupno: item.ukupno || item.cena || "0 RSD",
    featureImage: item.featureImage || null,
    slug: item.slug || item.id,
  }));

  return {
    items: items,
    pagination: {
      currentPage: result.page || 1,
      totalPages: result.totalPages || 1,
      total: result.total || 0,
    },
  };
}

// ============================================================
//  PARTNERSKA PRODAVNICA
// ============================================================

export function prepareShopData(shop) {
  if (!shop) return {};

  return {
    shop: {
      active: shop.shop?.aktivan || false,
      logo: shop.shop?.logo || null,
      colors: shop.shop?.boje || [],
      fonts: shop.shop?.fontovi || [],
    },
    wallet: shop.novčanik || 0,
    rank: {
      points: shop.rank?.poeni || 0,
      discount: shop.rank?.popust || 0,
      level: shop.rank?.nivo || 0,
      maxOffers: shop.rank?.maxPonuda || 1,
    },
    affiliate: shop.affiliate || [],
  };
}

// ============================================================
//  PODEŠAVANJA
// ============================================================

export function prepareSettingsData(user) {
  if (!user) return {};

  return {
    user: {
      id: user.id,
      email: user.osnovno.email,
      firstName: user.osnovno.ime,
      lastName: user.osnovno.prezime,
      fullName: `${user.osnovno.ime} ${user.osnovno.prezime}`.trim(),
      avatar: user.osnovno.avatar || null,
    },
    formData: {},
    errors: {},
    messages: [],
  };
}

export function prepareSettingsDataWithErrors(user, errors, formData) {
  const data = prepareSettingsData(user);
  data.errors = errors || {};
  data.formData = formData || {};
  return data;
}

// ============================================================
//  DEFAULT EXPORT
// ============================================================

export default {
  prepareProfileData,
  prepareProfileDataWithErrors,
  prepareOrdersData,
  prepareOrderDetailsData,
  prepareWishlistData,
  prepareShopData,
  prepareSettingsData,
  prepareSettingsDataWithErrors,
};