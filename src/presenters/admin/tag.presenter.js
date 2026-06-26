export function prepareTagListData(result, query = {}) {
  return {
    items: result.data,
    columns: [
      { key: "naziv", label: "Naziv" },
      { key: "slug", label: "Slug" },
      { key: "domen", label: "Domen" },
      { key: "tip", label: "Tip" },
      { key: "aktivna", label: "Aktivna" },
      { key: "indeksiranje", label: "Indeksiranje" },
      { key: "kreiran", label: "Kreiran" },
    ],
    actions: [
      { type: "view", url: "/admin/tagovi/detalji/", icon: "eye" },
      { type: "edit", url: "/admin/tagovi/izmena/", icon: "pencil" },
      { type: "delete", url: "/admin/tagovi/", icon: "trash" },
    ],
    pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      basePath: "/admin/tagovi",
      query,
    },
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Tagovi", url: null },
    ],
    topbar: {
      createUrl: "/admin/tagovi/novo",
      createLabel: "Novi tag",
      searchUrl: "/admin/tagovi/pretraga",
      search: query.search || "",
      filters: [
        { type: "select", name: "type", label: "Tip", value: query.type || "", options: [
          { value: "", label: "Svi tipovi" },
          { value: "color", label: "Boja" },
          { value: "size", label: "Veličina" },
          { value: "material", label: "Materijal" },
          { value: "brand", label: "Brend" },
        ]},
      ],
    },
  };
}

export function prepareTagDetailsData(tag) {
  return {
    backUrl: "/admin/tagovi",
    editUrl: `/admin/tagovi/izmena/${tag.id}`,
    sections: [
      {
        title: "Osnovni podaci",
        type: "table",
        rows: [
          { label: "Naziv", value: tag.osnovno.naziv },
          { label: "Slug", value: tag.osnovno.slug },
          { label: "Domen", value: tag.osnovno.domen },
          { label: "Tip", value: tag.osnovno.tip },
        ],
      },
      {
        title: "Opis",
        type: "table",
        rows: [
          { label: "Kratak opis", value: tag.osnovno.kratakOpis },
          { label: "Dugi opis", value: tag.osnovno.dugiOpis || "-" },
        ],
      },
      {
        title: "Meta podaci",
        type: "table",
        rows: [
          { label: "Indeksiranje", value: tag.meta.indeksiranje },
          { label: "Prioritet", value: tag.meta.prioritet },
          { label: "Aktivna", value: tag.meta.aktivna },
        ],
      },
    ],
    sidebar: [
      {
        title: "Vreme",
        type: "table",
        rows: [
          { label: "Kreirano", value: tag.vreme.kreirano },
          { label: "Ažurirano", value: tag.vreme.azurirano },
        ],
      },
    ],
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Tagovi", url: "/admin/tagovi" },
      { label: tag.osnovno.naziv, url: null },
    ],
  };
}

export function prepareTagFormData(tag = null) {
  const isEdit = !!tag;

  return {
    formAction: isEdit ? `/admin/tagovi/${tag.id}` : "/admin/tagovi",
    isEdit,
    submitLabel: isEdit ? "Sačuvaj izmene" : "Kreiraj tag",
    cancelUrl: isEdit ? `/admin/tagovi/detalji/${tag.id}` : "/admin/tagovi",
    fields: [
      { 
        name: "name", 
        type: "text", 
        label: "Naziv", 
        required: true, 
        value: tag?.osnovno?.naziv || "",
        help: "Slug će biti automatski generisan iz naziva."
      },
      // Uklonjeno polje za slug – automatski se generiše u servisu
      {
        name: "domain", 
        type: "select", 
        label: "Domen", 
        required: true,
        value: tag?.osnovno?.domenRaw || "",
        options: [
          { value: "item", label: "Proizvod" },
          { value: "post", label: "Blog" },
        ],
      },
      {
        name: "type", 
        type: "select", 
        label: "Tip", 
        required: true,
        value: tag?.osnovno?.tipRaw || "",
        options: [
          { value: "color", label: "Boja" },
          { value: "size", label: "Veličina" },
          { value: "material", label: "Materijal" },
          { value: "season", label: "Sezona" },
          { value: "style", label: "Stil" },
          { value: "collection", label: "Kolekcija" },
          { value: "brand", label: "Brend" },
          { value: "topic", label: "Tema" },
          { value: "custom", label: "Prilagođeno" },
        ],
      },
      { 
        name: "shortDescription", 
        type: "textarea", 
        label: "Kratak opis", 
        required: true, 
        value: tag?.osnovno?.kratakOpis || "",
        rows: 3,
      },
      { 
        name: "longDescription", 
        type: "textarea", 
        label: "Dugi opis", 
        value: tag?.osnovno?.dugiOpis || "",
        rows: 4,
      },
      { 
        name: "isIndexable", 
        type: "checkbox", 
        label: "Dozvoli indeksiranje", 
        value: tag?.meta?.indeksiranje !== "Zabranjeno" 
      },
      { 
        name: "meta[isActive]", 
        type: "checkbox", 
        label: "Aktivna", 
        value: tag?.meta?.aktivna !== "Neaktivan" 
      },
      { 
        name: "meta[priority]", 
        type: "number", 
        label: "Prioritet", 
        value: tag?.meta?.prioritet || 0,
        min: 0,
        max: 100,
        step: 1,
        help: "Veći broj znači veći prioritet (0-100)."
      },
    ],
  };
}