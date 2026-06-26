export function prepareOrderListData(result, query = {}) {
  return {
    items: result.data,
    columns: [
      { key: "id", label: "ID" },
      { key: "kupac", label: "Kupac" },
      { key: "email", label: "Email" },
      { key: "tipKupca", label: "Tip" },
      { key: "brojStavki", label: "Stavke" },
      { key: "ukupno", label: "Ukupno" },
      { key: "status", label: "Status" },
      { key: "grad", label: "Grad" },
      { key: "kreiran", label: "Kreiran" },
    ],
    actions: [
      { type: "view", url: "/admin/porudzbine/detalji/", icon: "eye" },
    ],
    pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      basePath: "/admin/porudzbine",
      query,
    },
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Porudžbine", url: null },
    ],
    topbar: {
      searchUrl: "/admin/porudzbine/pretraga",
      search: query.search || "",
      filters: [
        { type: "select", name: "status", label: "Status", value: query.status || "", options: [
          { value: "", label: "Svi statusi" },
          { value: "pending", label: "Na čekanju" },
          { value: "confirmed", label: "Potvrđena" },
          { value: "processing", label: "U obradi" },
          { value: "shipped", label: "Poslata" },
          { value: "delivered", label: "Isporučena" },
          { value: "completed", label: "Završena" },     // ✅ dodato
          { value: "cancelled", label: "Otkazana" },
          { value: "returned", label: "Vraćena" },
          { value: "refunded", label: "Refundirana" },
          { value: "failed", label: "Neuspešna" },
        ]},
      ],
    },
  };
}

export function prepareOrderDetailsData(order, allowedStatuses) {
  return {
    backUrl: "/admin/porudzbine",
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
          { label: "Popust", value: order.finansije.popust > 0 ? `${order.finansije.popust} RSD (${order.finansije.kuponKod})` : "Nema" },
          { label: "Ukupno", value: `${order.finansije.ukupno} RSD` },
        ],
      },
    ],
    sidebar: [
      {
        title: "Status",
        type: "table",
        rows: [
          { label: "Trenutni", value: order.status.trenutni },
          { label: "Potvrđena", value: order.status.potvrđena || "-" },
          { label: "Poslata", value: order.status.poslata || "-" },
          { label: "Isporučena", value: order.status.isporučena || "-" },
          { label: "Završena", value: order.status.završena || "-" },   // ✅ dodato
          { label: "Otkazana", value: order.status.otkazana || "-" },
        ],
      },
      {
        title: "Promena statusa",
        type: "custom",
        content: "status-change-form",
        data: {
          orderId: order.id,
          currentStatus: order.status.trenutniRaw,
          allowedStatuses,
        },
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
      { label: "Porudžbine", url: "/admin/porudzbine" },
      { label: `#${order.id.slice(-6)}`, url: null },
    ],
  };
}