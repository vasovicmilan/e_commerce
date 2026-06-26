export function prepareTestimonialListData(result, query = {}) {
  return {
    items: result.data,
    columns: [
      { key: "ime", label: "Ime" },
      { key: "email", label: "Email" },
      { key: "ocena", label: "Ocena" },
      { key: "naslov", label: "Naslov" },
      { key: "proizvod", label: "Proizvod" },
      { key: "odobren", label: "Odobren" },
      { key: "istaknut", label: "Istaknut" },
      { key: "kreiran", label: "Kreiran" },
    ],
    actions: [
      { type: "view", url: "/admin/testimoniali/detalji/", icon: "eye" },
      { type: "delete", url: "/admin/testimoniali/", icon: "trash" },
    ],
    pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      basePath: "/admin/testimoniali",
      query,
    },
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "testimoniali", url: null },
    ],
    topbar: {
      searchUrl: "/admin/testimoniali/pretraga",
      search: query.search || "",
      filters: [
        { type: "select", name: "isApproved", label: "Odobren", value: query.isApproved || "", options: [
          { value: "", label: "Svi" },
          { value: "true", label: "Odobreni" },
          { value: "false", label: "Neodobreni" },
        ]},
        { type: "select", name: "rating", label: "Ocena", value: query.rating || "", options: [
          { value: "", label: "Sve" },
          { value: "5", label: "★★★★★" },
          { value: "4", label: "★★★★" },
          { value: "3", label: "★★★" },
          { value: "2", label: "★★" },
          { value: "1", label: "★" },
        ]},
      ],
    },
  };
}

export function prepareTestimonialDetailsData(testimonial) {
  return {
    backUrl: "/admin/testimoniali",
    sections: [
      {
        title: "Podaci",
        type: "table",
        rows: [
          { label: "Ime", value: testimonial.osnovno.ime },
          { label: "Email", value: testimonial.osnovno.email || "-" },
          { label: "Ocena", value: testimonial.osnovno.ocenaZvezdice },
          { label: "Naslov", value: testimonial.osnovno.naslov || "-" },
          { label: "Komentar", value: testimonial.osnovno.komentar },
        ],
      },
      {
        title: "Proizvod",
        type: "table",
        rows: [
          { label: "Naziv", value: testimonial.proizvod?.naziv || "-" },
          { label: "Slug", value: testimonial.proizvod?.slug || "-" },
        ],
      },
    ],
    sidebar: [
      {
        title: "Status",
        type: "custom",
        content: "testimonial-actions",
        data: {
          testimonialId: testimonial.id,
          isApproved: testimonial.status.odobren,
          isFeatured: testimonial.status.istaknut,
        },
      },
      {
        title: "Vreme",
        type: "table",
        rows: [
          { label: "Kreirano", value: testimonial.vreme.kreirano },
          { label: "Ažurirano", value: testimonial.vreme.ažurirano },
          { label: "Odobreno", value: testimonial.status.odobrenAt || "-" },
        ],
      },
    ],
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "testimoniali", url: "/admin/testimoniali" },
      { label: testimonial.osnovno.ime, url: null },
    ],
  };
}