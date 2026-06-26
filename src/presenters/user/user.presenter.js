export function prepareProfileData(user) {
  return {
    user,
    seo: {
      pageTitle: "Moj profil",
      pageDescription: "Pregled i upravljanje vašim profilom.",
    },
    errors: {},
    formData: {},
  };
}

export function prepareProfileDataWithErrors(user, errors, formData) {
  return {
    ...prepareProfileData(user),
    errors,
    formData,
  };
}

export function prepareOrdersData(result) {
  return {
    orders: result.data || [],
    pagination: {
      currentPage: result.page || 1,
      totalPages: result.totalPages || 1,
      basePath: "/profil/porudzbine",
      query: {},
    },
    seo: {
      pageTitle: "Moje porudžbine",
      pageDescription: "Pregled svih vaših porudžbina.",
    },
  };
}

export function prepareOrderDetailsData(order) {
  return {
    order,
    seo: {
      pageTitle: `Porudžbina #${order.id?.slice(-6) || ""}`,
      pageDescription: "Detalji vaše porudžbine.",
    },
    breadcrumbs: [
      { label: "Moj profil", url: "/profil/moj-profil" },
      { label: "Porudžbine", url: "/profil/porudzbine" },
      { label: `#${order.id?.slice(-6) || ""}`, url: null },
    ],
  };
}

export function prepareShopData(shop) {
  return {
    shop,
    seo: {
      pageTitle: "Moja prodavnica",
      pageDescription: "Upravljanje partnerskom prodavnicom.",
    },
  };
}

export function prepareSettingsData(user) {
  return {
    user,
    seo: {
      pageTitle: "Podešavanja naloga",
      pageDescription: "Promena lozinke i podešavanja naloga.",
    },
    errors: {},
    formData: {},
  };
}

export function prepareSettingsDataWithErrors(user, errors, formData) {
  return {
    ...prepareSettingsData(user),
    errors,
    formData,
  };
}