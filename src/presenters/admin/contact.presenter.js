export function prepareContactListData(result, query = {}) {
  return {
    items: result.data,
    columns: [
      { key: "ime", label: "Ime" },
      { key: "email", label: "Email" },
      { key: "naslov", label: "Naslov" },
      { key: "status", label: "Status" },
      { key: "datum", label: "Datum" },
    ],
    actions: [
      { type: "view", url: "/admin/kontakt/detalji/", icon: "eye" },
    ],
    pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      basePath: "/admin/kontakt",
      query,
    },
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Kontakt poruke", url: null },
    ],
    topbar: {
      searchUrl: "/admin/kontakt/pretraga",
      search: query.search || "",
      filters: [
        { type: "select", name: "status", label: "Status", value: query.status || "", options: [
          { value: "", label: "Svi statusi" },
          { value: "new", label: "Novi" },
          { value: "read", label: "Pročitan" },
          { value: "replied", label: "Odgovoren" },
          { value: "archived", label: "Arhiviran" },
        ]},
      ],
    },
  };
}

export function prepareContactDetailsData(contact) {
  return {
    backUrl: "/admin/kontakt",
    sections: [
      {
        title: "Pošiljalac",
        type: "table",
        rows: [
          { label: "Ime", value: contact.osnovno.ime },
          { label: "Email", value: contact.osnovno.email },
          { label: "Telefon", value: contact.osnovno.telefon || "-" },
          { label: "Status", value: contact.osnovno.status },
        ],
      },
      {
        title: "Poruka",
        type: "table",
        rows: [
          { label: "Naslov", value: contact.osnovno.naslov },
          { label: "Poruka", value: contact.poruka },
        ],
      },
    ],
    sidebar: [
      {
        title: "Status",
        type: "custom",
        content: "status-change-form",
        data: {
          contactId: contact.id,
          currentStatus: contact.osnovno.statusRaw,
          statuses: ["read", "replied", "archived"],
        },
      },
      {
        title: "Vreme",
        type: "table",
        rows: [
          { label: "Kreirano", value: contact.vreme.kreirano },
          { label: "Ažurirano", value: contact.vreme.ažurirano },
        ],
      },
    ],
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Kontakt", url: "/admin/kontakt" },
      { label: contact.osnovno.naslov, url: null },
    ],
  };
}