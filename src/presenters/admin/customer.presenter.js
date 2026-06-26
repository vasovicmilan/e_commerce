export function prepareCustomerListData(result, query = {}) {
  return {
    items: result.data,
    columns: [
      { key: "email", label: "Email" },
      { key: "ime", label: "Ime" },
      { key: "prezime", label: "Prezime" },
      { key: "brojTelefona", label: "Telefoni" },
      { key: "brojAdresa", label: "Adrese" },
      { key: "brojPorudzbina", label: "Porudžbine" },
      { key: "kreiran", label: "Kreiran" },
    ],
    actions: [
      { type: "view", url: "/admin/kupci/detalji/", icon: "eye" },
      { type: "edit", url: "/admin/kupci/izmena/", icon: "pencil" },
      { type: "delete", url: "/admin/kupci/", icon: "trash" },
    ],
    pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      basePath: "/admin/kupci",
      query,
    },
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Kupci", url: null },
    ],
    topbar: {
      searchUrl: "/admin/kupci/pretraga",
      search: query.search || "",
      filters: [
        { type: "select", name: "hasOrders", label: "Porudžbine", value: query.hasOrders || "", options: [
          { value: "", label: "Svi" },
          { value: "true", label: "Ima porudžbine" },
          { value: "false", label: "Bez porudžbina" },
        ]},
        { type: "text", name: "city", label: "Grad", value: query.city || "" },
      ],
    },
  };
}

export function prepareCustomerDetailsData(customer) {
  return {
    backUrl: "/admin/kupci",
    editUrl: `/admin/kupci/izmena/${customer.id}`,
    sections: [
      {
        title: "Osnovni podaci",
        type: "table",
        rows: [
          { label: "Email", value: customer.osnovno.email },
          { label: "Ime", value: `${customer.osnovno.ime} ${customer.osnovno.prezime}` },
          { label: "Prihvaćeno", value: customer.osnovno.prihvaceno },
        ],
      },
      {
        title: "Kontakt",
        type: "table",
        rows: [
          { label: "Telefoni", value: customer.telefoni?.map(t => t.value).join(", ") || "-" },
          { label: "Adrese", value: customer.adrese?.map(a => `${a.street} ${a.number}, ${a.city}`).join(" | ") || "-" },
        ],
      },
      {
        title: "Porudžbine",
        type: "table",
        rows: [
          { label: "Ukupno", value: customer.porudzbine.ukupno },
        ],
      },
    ],
    sidebar: [
      {
        title: "Vreme",
        type: "table",
        rows: [
          { label: "Kreirano", value: customer.vreme.kreirano },
          { label: "Ažurirano", value: customer.vreme.ažurirano },
        ],
      },
    ],
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Kupci", url: "/admin/kupci" },
      { label: customer.osnovno.email, url: null },
    ],
  };
}

export function prepareCustomerFormData(customer = null) {
  const isEdit = !!customer;

  return {
    formAction: isEdit ? `/admin/kupci/${customer.id}` : "",
    isEdit,
    submitLabel: "Sačuvaj izmene",
    cancelUrl: `/admin/kupci/detalji/${customer?.id}`,
    fields: [
      { name: "email", type: "email", label: "Email", required: true, value: customer?.osnovno?.email || "" },
      { name: "firstName", type: "text", label: "Ime", required: true, value: customer?.osnovno?.ime || "" },
      { name: "lastName", type: "text", label: "Prezime", required: true, value: customer?.osnovno?.prezime || "" },
      { name: "acceptance", type: "checkbox", label: "Prihvaćeno", value: customer?.osnovno?.prihvaceno === "Da" },
    ],
  };
}