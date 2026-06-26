export function prepareNewsletterListData(result, query = {}) {
  return {
    items: result.data,
    columns: [
      { key: "email", label: "Email" },
      { key: "ime", label: "Ime" },
      { key: "aktivan", label: "Aktivan" },
      { key: "prihvaćeno", label: "Prihvaćeno" },
      { key: "kreiran", label: "Kreiran" },
    ],
    actions: [
      { type: "view", url: "/admin/newsletter/detalji/", icon: "eye" },
      { type: "delete", url: "/admin/newsletter/", icon: "trash" },
    ],
    pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      basePath: "/admin/newsletter",
      query,
    },
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Newsletter", url: null },
    ],
    topbar: {
      searchUrl: "/admin/newsletter/pretraga",
      search: query.search || "",
      filters: [
        { type: "select", name: "isActive", label: "Status", value: query.isActive || "", options: [
          { value: "", label: "Svi" },
          { value: "true", label: "Aktivni" },
          { value: "false", label: "Neaktivni" },
        ]},
      ],
    },
  };
}

export function prepareNewsletterDetailsData(newsletter) {
  return {
    backUrl: "/admin/newsletter",
    sections: [
      {
        title: "Podaci",
        type: "table",
        rows: [
          { label: "Email", value: newsletter.osnovno.email },
          { label: "Ime", value: newsletter.osnovno.ime || "-" },
          { label: "Aktivan", value: newsletter.osnovno.aktivan ? "Da" : "Ne" },
          { label: "Prihvaćeno", value: newsletter.osnovno.prihvaćeno ? "Da" : "Ne" },
        ],
      },
    ],
    sidebar: [
      {
        title: "Akcije",
        type: "custom",
        content: "toggle-active",
        data: {
          newsletterId: newsletter.id,
          isActive: newsletter.osnovno.aktivan,
        },
      },
      {
        title: "Vreme",
        type: "table",
        rows: [
          { label: "Kreirano", value: newsletter.vreme.kreirano },
          { label: "Ažurirano", value: newsletter.vreme.ažurirano },
        ],
      },
    ],
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Newsletter", url: "/admin/newsletter" },
      { label: newsletter.osnovno.email, url: null },
    ],
  };
}