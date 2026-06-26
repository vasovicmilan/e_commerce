import { formatDateTime } from "../../utils/date.time.util.js";

export function prepareTempOrderListData(result, query = {}) {
  return {
    items: result.data,
    columns: [
      { key: "kupac", label: "Kupac" },
      { key: "email", label: "Email" },
      { key: "tipKupca", label: "Tip" },
      { key: "brojStavki", label: "Stavke" },
      { key: "ukupno", label: "Ukupno" },
      { key: "status", label: "Status" },
      { key: "kreiran", label: "Kreiran" },
      { key: "ističe", label: "Ističe" },
    ],
    actions: [
      { type: "view", url: "/admin/privremene-porudzbine/detalji/", icon: "eye" },
    ],
    pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      basePath: "/admin/privremene-porudzbine",
      query,
    },
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Privremene porudžbine", url: null },
    ],
    topbar: {
      searchUrl: "/admin/privremene-porudzbine/pretraga",
      search: query.search || "",
      filters: [
        { type: "select", name: "buyerModel", label: "Tip kupca", value: query.buyerModel || "", options: [
          { value: "", label: "Svi" },
          { value: "User", label: "Korisnik" },
          { value: "Customer", label: "Kupac" },
        ]},
      ],
    },
  };
}

export function prepareTempOrderDetailsData(order) {
  return {
    id: order.id,
    backUrl: "/admin/privremene-porudzbine",
    sections: [
      {
        title: "Kupac",
        type: "table",
        rows: [
          { label: "Ime", value: `${order.kupac.ime} ${order.kupac.prezime}` },
          { label: "Email", value: order.kupac.email },
          { label: "Tip", value: order.kupac.tip },
          { label: "Telefon", value: order.kontakt?.telefon?.value || "-" },
          { label: "Adresa", value: `${order.kontakt?.adresa?.street || ""} ${order.kontakt?.adresa?.number || ""}, ${order.kontakt?.adresa?.postalCode || ""} ${order.kontakt?.adresa?.city || ""}` },
        ],
      },
      {
        title: "Stavke",
        type: "list",
        itemType: "order-item",
        items: order.stavke,
      },
      {
        title: "Finansije",
        type: "table",
        rows: [
          { label: "Subtotal", value: `${order.finansije.subtotal} RSD` },
          { label: "Dostava", value: `${order.finansije.shipping} RSD` },
          { label: "Popust", value: order.finansije.popust > 0 ? `${order.finansije.popust} RSD` : "Nema" },
          { label: "Ukupno", value: `${order.finansije.ukupno} RSD` },
        ],
      },
      {
        title: "Podešavanja",
        type: "table",
        rows: [
          { label: "Novi nalog", value: order.podesavanja.noviNalog ? "Da" : "Ne" },
          { label: "Novi telefon", value: order.podesavanja.noviTelefon ? "Da" : "Ne" },
          { label: "Nova adresa", value: order.podesavanja.novaAdresa ? "Da" : "Ne" },
        ],
      },
    ],
    sidebar: [
      {
        title: "Verifikacija",
        type: "custom",
        content: "temp-order-verify",
        data: {
          orderId: order.id,
          tokenExpiration: order.token.ističe,
        },
      },
      {
        title: "Token",
        type: "table",
        rows: [
          // 🔥 Prikazujemo ceo token (bez skraćivanja), sa prelamanjem reči
          { label: "Token", value: order.token.vrednost },
          { label: "Ističe", value: order.token.ističe },
        ],
      },
      {
        title: "Vreme",
        type: "table",
        rows: [
          { label: "Kreirano", value: order.vreme.kreirano },
          { label: "Ažurirano", value: order.vreme.ažurirano },
        ],
      },
    ],
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Privremene porudžbine", url: "/admin/privremene-porudzbine" },
      { label: `#${order.id.slice(-6)}`, url: null },
    ],
  };
}