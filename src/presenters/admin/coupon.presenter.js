import {
  formatDateForInput,
  parseDate,
} from "../../utils/date.time.util.js";

export function prepareCouponListData(result, query = {}) {
  return {
    items: result.data,
    columns: [
      { key: "kod", label: "Kod" },
      { key: "tip", label: "Tip" },
      { key: "popust", label: "Popust" },
      { key: "korišćenje", label: "Korišćenje" },
      { key: "poKorisniku", label: "Po korisniku" },
      { key: "ograničenNa", label: "Ograničen na" },
      { key: "validan", label: "Validan" },
      { key: "aktivan", label: "Aktivan" },
      { key: "kreiran", label: "Kreiran" },
    ],
    actions: [
      { type: "view", url: "/admin/kuponi/detalji/", icon: "eye" },
      { type: "edit", url: "/admin/kuponi/izmena/", icon: "pencil" },
      { type: "delete", url: "/admin/kuponi/", icon: "trash" },
    ],
    pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      basePath: "/admin/kuponi",
      query,
    },
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Kuponi", url: null },
    ],
    topbar: {
      createUrl: "/admin/kuponi/novo",
      createLabel: "Novi kupon",
      searchUrl: "/admin/kuponi/pretraga",
      search: query.search || "",
    },
  };
}

export function prepareCouponDetailsData(coupon) {
  const history = coupon.istorija || [];
  // 🔥 Prikaz za usagePerUser
  const usagePerUserDisplay = coupon.korišćenje.poKorisniku === null ? "Neograničeno" : `${coupon.korišćenje.poKorisniku} puta`;
  
  return {
    backUrl: "/admin/kuponi",
    editUrl: `/admin/kuponi/izmena/${coupon.id}`,
    sections: [
      {
        title: "Osnovni podaci",
        type: "table",
        rows: [
          { label: "Kod", value: coupon.osnovno.kod },
          { label: "Tip", value: coupon.osnovno.tip },
          { label: "Popust", value: coupon.osnovno.popust },
          { label: "Aktivan", value: coupon.osnovno.aktivan ? "Da" : "Ne" },
        ],
      },
      {
        title: "Korišćenje i ograničenja",
        type: "table",
        rows: [
          { label: "Globalni limit", value: coupon.korišćenje.limit === "Neograničeno" ? "Neograničeno" : coupon.korišćenje.limit },
          { label: "Korišćeno", value: coupon.korišćenje.korišćeno },
          { label: "Preostalo", value: coupon.korišćenje.preostalo },
          { label: "Po korisniku", value: usagePerUserDisplay },
          { label: "Min. iznos korpe", value: coupon.korišćenje.minIznosKorpe > 0 ? `${coupon.korišćenje.minIznosKorpe} RSD` : "Nema" },
        ],
      },
      {
        title: "Dozvoljeni korisnici",
        type: "table",
        rows: [
          { label: "Ograničenje", value: coupon.ograničenja?.isGlobal ? "Svi korisnici" : `${coupon.ograničenja?.allowedUsersCount || 0} korisnika` },
          { label: "Lista korisnika", value: coupon.ograničenja?.isGlobal ? "-" : (coupon.ograničenja?.allowedUsers || []).map((u) => u.email || u.id).join(", ") },
        ],
      },
      {
        title: "Važenje",
        type: "table",
        rows: [
          { label: "Važi od", value: coupon.važenje.važiOd || "Odmah" },
          { label: "Važi do", value: coupon.važenje.važiDo || "Bez ograničenja" },
          { label: "Trenutno validan", value: coupon.važenje.trenutnoValidan ? "Da" : "Ne" },
          { label: "Istekao", value: coupon.važenje.istekao ? "Da" : "Ne" },
        ],
      },
      {
        title: `Istorija korišćenja (${history.length})`,
        type: "list",
        itemType: "coupon-usage",
        items: history.length > 0 ? history : [{ poruka: "Nema korišćenja" }],
      },
    ],
    sidebar: [
      {
        title: "Vreme",
        type: "table",
        rows: [
          { label: "Kreirano", value: coupon.vreme.kreirano },
          { label: "Ažurirano", value: coupon.vreme.azurirano },
        ],
      },
    ],
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Kuponi", url: "/admin/kuponi" },
      { label: coupon.osnovno.kod, url: null },
    ],
  };
}

export function prepareCouponFormData(coupon = null, partners = []) {
  const isEdit = !!coupon;
  const partnerOptions = partners.map((p) => ({
    value: p.id,
    label: p.fullName ? `${p.fullName} (${p.email})` : p.email,
  }));
  let selectedUsers = [];
  if (isEdit && coupon?.ograničenja && !coupon.ograničenja.isGlobal) {
    selectedUsers = (coupon.ograničenja.allowedUsers || []).map((u) => u.id);
  }
  let usageLimitValue = "";
  if (isEdit && coupon?.korišćenje?.limit !== "Neograničeno" && coupon?.korišćenje?.limit !== null) {
    usageLimitValue = coupon.korišćenje.limit;
  }
  // 🔥 Ako je null, prikazati prazno polje
  const usagePerUserValue = isEdit ? (coupon?.korišćenje?.poKorisniku ?? '') : '';
  const validFrom = isEdit && coupon?.važenje?.važiOd ? formatDateForInput(parseDate(coupon.važenje.važiOd)) : "";
  const validUntil = isEdit && coupon?.važenje?.važiDo ? formatDateForInput(parseDate(coupon.važenje.važiDo)) : "";
  const isActiveValue = isEdit ? coupon?.osnovno?.aktivan !== false : true;
  
  return {
    formAction: isEdit ? `/admin/kuponi/${coupon.id}` : "/admin/kuponi",
    isEdit,
    submitLabel: isEdit ? "Sačuvaj izmene" : "Kreiraj kupon",
    cancelUrl: isEdit ? `/admin/kuponi/detalji/${coupon.id}` : "/admin/kuponi",
    fields: [
      {
        name: "code",
        type: "text",
        label: "Kod",
        required: true,
        value: coupon?.osnovno?.kod || "",
        max: 30,
        min: 3,
      },
      {
        name: "discountType",
        type: "select",
        label: "Tip popusta",
        required: true,
        value: coupon?.osnovno?.tipRaw || "percentage",
        options: [
          { value: "percentage", label: "Procentualni" },
          { value: "fixed", label: "Fiksni" },
        ],
      },
      {
        name: "discountValue",
        type: "number",
        label: "Vrednost popusta",
        required: true,
        value: coupon?.osnovno?.vrednost || "",
        min: 0,
        max: 100,
        step: 0.01,
        help: "Za procentualni popust unesite vrednost do 100, za fiksni iznos u RSD",
      },
      {
        name: "usageLimit",
        type: "number",
        label: "Globalni limit (prazno = neograničeno)",
        required: false,
        value: usageLimitValue,
        min: 1,
        step: 1,
        help: "Ostavite prazno ako kupon može da se koristi neograničen broj puta",
      },
      {
        name: "usagePerUser",
        type: "number",
        label: "Korišćenja po korisniku (prazno = neograničeno)",
        required: false,
        value: usagePerUserValue,
        min: 1,
        step: 1,
        help: "Ostavite prazno za neograničeno korišćenje po korisniku. Ako je postavljeno, važi samo za ulogovane korisnike.",
      },
      {
        name: "minCartAmount",
        type: "number",
        label: "Min. iznos korpe (RSD)",
        value: coupon?.korišćenje?.minIznosKorpe || 0,
        min: 0,
        step: 0.01,
      },
      {
        name: "validFrom",
        type: "date",
        label: "Važi od",
        value: validFrom,
      },
      {
        name: "validUntil",
        type: "date",
        label: "Važi do",
        value: validUntil,
      },
      {
        name: "isActive",
        type: "checkbox",
        label: "Aktivan",
        value: isActiveValue,
      },
      {
        name: "allowedUsers",
        type: "multiselect",
        label: "Dozvoljeni korisnici (prazno = svi)",
        value: selectedUsers,
        options: partnerOptions,
        help: "Ostavite prazno da bi kupon bio dostupan svim korisnicima. Držite Ctrl (Cmd) za višestruki odabir.",
      },
    ],
  };
}