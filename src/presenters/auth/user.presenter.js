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
    },
    telephones: user.kontakt?.telefoni || [],
    addresses: user.kontakt?.adrese || [],
    orders: user.porudzbine || [],
    partner: user.partner || null,
    vreme: user.vreme || {},
    // Form data placeholders
    formData: {},
    errors: {},
    messages: {
      success: [],
      error: [],
    },
  };
}

export function prepareProfileDataWithErrors(user, errors, formData) {
  const data = prepareProfileData(user);
  data.errors = errors || {};
  data.formData = formData || {};
  return data;
}

// ============================================================
//  PORUDŽBINE
// ============================================================

export function prepareOrdersData(result) {
  return {
    orders: result.data || [],
    pagination: {
      currentPage: result.page || 1,
      totalPages: result.totalPages || 1,
      total: result.total || 0,
    },
  };
}

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
//  PARTNERSKA PRODAVNICA (SHOP)
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
//  PODEŠAVANJA (SETTINGS)
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
    messages: {
      success: [],
      error: [],
    },
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
  prepareShopData,
  prepareSettingsData,
  prepareSettingsDataWithErrors,
};