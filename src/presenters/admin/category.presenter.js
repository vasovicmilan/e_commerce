export function prepareCategoryListData(result, query = {}) {
  return {
    items: result.data,
    columns: [
      { key: "slika", label: "Slika" }, // 🔥 DODATO
      { key: "naziv", label: "Naziv" },
      { key: "slug", label: "Slug" },
      { key: "domen", label: "Domen" },
      { key: "parentNaziv", label: "Roditelj" },
      { key: "aktivna", label: "Aktivna" },
      { key: "indeksiranje", label: "Indeksiranje" },
      { key: "prioritet", label: "Prioritet" },
      { key: "kreirana", label: "Kreirana" },
    ],
    actions: [
      { type: "view", url: "/admin/kategorije/detalji/", icon: "eye" },
      { type: "edit", url: "/admin/kategorije/izmena/", icon: "pencil" },
      { type: "delete", url: "/admin/kategorije/", icon: "trash" },
    ],
    pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      basePath: "/admin/kategorije",
      query,
    },
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Kategorije", url: null },
    ],
    topbar: {
      createUrl: "/admin/kategorije/dodavanje",
      createLabel: "Nova kategorija",
      searchUrl: "/admin/kategorije/pretraga",
      search: query.search || "",
    },
  };
}

export function prepareCategoryDetailsData(category) {
  // Konstruiši punu putanju do slike
  let imageUrl = category.slika?.url ? `/images/categories/${category.slika.url}` : null;

  return {
    backUrl: "/admin/kategorije",
    editUrl: `/admin/kategorije/izmena/${category.id}`,
    sections: [
      {
        title: "Osnovni podaci",
        type: "table",
        rows: [
          { label: "Naziv", value: category.osnovno.naziv },
          { label: "Slug", value: category.osnovno.slug },
          { label: "Domen", value: category.osnovno.domen },
          { label: "Roditelj", value: category.osnovno.parentNaziv || "-" },
        ],
      },
      {
        title: "Slika",
        type: "table",
        rows: [
          {
            label: "Istaknuta slika",
            value: imageUrl
              ? `<img src="${imageUrl}" alt="${category.slika.opis || ''}" style="max-height:150px; border-radius:4px;">`
              : "Nema slike"
          }
        ],
      },
      {
        title: "Opis",
        type: "table",
        rows: [
          { label: "Kratak opis", value: category.osnovno.kratakOpis || "-" },
          { label: "Dugi opis", value: category.osnovno.dugiOpis || "-" },
        ],
      },
      {
        title: "Meta podaci",
        type: "table",
        rows: [
          { label: "Indeksiranje", value: category.meta.indeksiranje },
          { label: "Prioritet", value: category.meta.prioritet },
          { label: "Aktivna", value: category.meta.aktivna },
        ],
      },
    ],
    sidebar: [
      {
        title: "Vreme",
        type: "table",
        rows: [
          { label: "Kreirano", value: category.vreme.kreirano },
          { label: "Ažurirano", value: category.vreme.azurirano },
        ],
      },
    ],
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Kategorije", url: "/admin/kategorije" },
      { label: category.osnovno.naziv, url: null },
    ],
  };
}

export function prepareCategoryFormData(category = null) {
  const isEdit = !!category;

  // Konstruiši punu putanju za preview slike
  let previewUrl = null;
  if (category?.slika?.url) {
    previewUrl = `/images/categories/${category.slika.url}`;
  }

  return {
    formAction: isEdit ? `/admin/kategorije/${category.id}` : "/admin/kategorije",
    formEnctype: "multipart/form-data",
    isEdit,
    submitLabel: isEdit ? "Sačuvaj izmene" : "Kreiraj kategoriju",
    cancelUrl: isEdit ? `/admin/kategorije/detalji/${category.id}` : "/admin/kategorije",
    fields: [
      { 
        name: "name", 
        type: "text", 
        label: "Naziv", 
        required: true, 
        value: category?.osnovno?.naziv || "",
        help: "Slug će biti automatski generisan iz naziva."
      },
      {
        name: "domain", 
        type: "select", 
        label: "Domen", 
        required: true,
        value: category?.osnovno?.domenRaw || "",
        options: [
          { value: "item", label: "Proizvod" },
          { value: "post", label: "Blog" },
        ],
      },
      { 
        name: "shortDescription", 
        type: "textarea", 
        label: "Kratak opis", 
        required: true, 
        value: category?.osnovno?.kratakOpis || "",
        rows: 3,
      },
      { 
        name: "longDescription", 
        type: "textarea", 
        label: "Dugi opis", 
        value: category?.osnovno?.dugiOpis || "",
        rows: 4,
      },
      { 
        name: "categoryImage", 
        type: "file", 
        label: "Istaknuta slika", 
        required: !isEdit,
        accept: "image/jpeg,image/png,image/webp,image/avif",
        preview: previewUrl,
        help: isEdit ? "Ostavite prazno ako ne želite da menjate sliku." : "Preporučena veličina: 1200x800px"
      },
      { 
        name: "categoryImageDesc", 
        type: "text", 
        label: "Opis slike", 
        value: category?.slika?.opis || "",
        help: "Kratak opis za SEO i pristupačnost."
      },
      { 
        name: "parent", 
        type: "text", 
        label: "Roditelj ID", 
        value: category?.osnovno?.parentId || "",
        help: "Unesite ID postojeće kategorije ako želite da ova bude podkategorija."
      },
      { 
        name: "isIndexable", 
        type: "checkbox", 
        label: "Dozvoli indeksiranje", 
        value: category?.meta?.indeksiranje !== "Zabranjeno" 
      },
      { 
        name: "meta[isActive]", 
        type: "checkbox", 
        label: "Aktivna", 
        value: category?.meta?.aktivna !== "Neaktivan" 
      },
      { 
        name: "meta[priority]", 
        type: "number", 
        label: "Prioritet", 
        value: category?.meta?.prioritet || 0,
        min: 0,
        max: 100,
        step: 1,
        help: "Veći broj znači veći prioritet (0-100)."
      },
    ],
  };
}