export function prepareItemListData(result, query = {}) {
  return {
    items: result.data,
    columns: [
      { key: "slika", label: "Slika" },
      { key: "sku", label: "SKU" },
      { key: "naziv", label: "Naziv" },
      { key: "status", label: "Status" },
      { key: "kategorije", label: "Kategorije" },
      { key: "cena", label: "Cena" },
      { key: "akcijskaCena", label: "Akcijska" },
      { key: "brojVarijacija", label: "Varijacije" },
      { key: "prosecnaOcena", label: "Ocena" },
      { key: "ukupnoProdato", label: "Prodato" },
      { key: "kreiran", label: "Kreiran" },
    ],
    actions: [
      { type: "view", url: "/admin/artikli/detalji/", icon: "eye" },
      { type: "edit", url: "/admin/artikli/izmena/", icon: "pencil" },
      { type: "custom", url: "/admin/artikli/", idKey: "id", subPath: "varijacije", icon: "layers", label: "Varijacije" },
      { type: "custom", url: "/admin/artikli/", idKey: "id", subPath: "seo", icon: "search", label: "SEO" },
      { type: "delete", url: "/admin/artikli/", icon: "trash" },
    ],
    pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      basePath: "/admin/artikli",
      query,
    },
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Artikli", url: null },
    ],
    topbar: {
      createUrl: "/admin/artikli/novo",
      createLabel: "Novi artikal",
      searchUrl: "/admin/artikli/pretraga",
      search: query.search || "",
      filters: [
        {
          type: "select", name: "status", label: "Status", value: query.status || "",
          options: [
            { value: "", label: "Svi statusi" },
            { value: "not-published", label: "Nije objavljen" },
            { value: "published", label: "Objavljen" },
            { value: "actioned", label: "Na akciji" },
            { value: "featured", label: "Istaknut" },
            { value: "empty", label: "Nema na stanju" },
          ],
        },
      ],
    },
  };
}

export function prepareItemDetailsData(item) {
  return {
    backUrl: "/admin/artikli",
    editUrl: `/admin/artikli/izmena/${item.id}`,
    sections: [
      {
        title: "Osnovni podaci",
        type: "table",
        rows: [
          { label: "Naziv", value: item.osnovno.naziv },
          { label: "SKU", value: item.osnovno.sku },
          { label: "Slug", value: item.osnovno.slug },
          { label: "Status", value: item.osnovno.status },
        ],
      },
      {
        title: "Cene",
        type: "table",
        rows: [
          { label: "Osnovna cena", value: item.cene.osnovna },
          { label: "Akcijska cena", value: item.cene.akcijska || "Nije na akciji" },
          { label: "Na akciji", value: item.cene.naAkciji ? "Da" : "Ne" },
          { label: "Varijacija na akciji", value: item.cene.brojVarijacijaNaAkciji },
        ],
      },
      {
        title: "Varijacije",
        type: "list",
        itemType: "variation",
        items: item.varijacije,
      },
      {
        title: "SEO",
        type: "table",
        rows: [
          { label: "Opis", value: item.seo.opis || "-" },
          { label: "Kratak opis", value: item.seo.kratakOpis || "-" },
          { label: "Ključne reči", value: (item.seo.kljucneReci || []).join(", ") || "-" },
        ],
      },
      // === NOVA SEKCIA ZA FAQ ===
      {
        title: "FAQ",
        type: "list",
        itemType: "faq",
        items: item.seo.faq || [],
      },
      {
        title: "Kategorije i tagovi",
        type: "table",
        rows: [
          { label: "Kategorije", value: item.kategorije?.map(c => c.naziv).join(", ") || "-" },
          { label: "Tagovi", value: item.tagovi?.map(t => `${t.naziv} (${t.tip})`).join(", ") || "-" },
        ],
      },
      {
        title: "Rating",
        type: "table",
        rows: [
          { label: "Prosek", value: `${item.rating?.prosek || 0} / 5` },
          { label: "Broj ocena", value: item.rating?.brojOcena || 0 },
        ],
      },
    ],
    sidebar: [
      {
        title: "Status",
        type: "custom",
        content: "status-change-form",
        data: {
          entityId: item.id,
          basePath: "/admin/artikli",
          currentStatus: item.osnovno.statusRaw,
          statuses: ["not-published", "published", "actioned", "featured", "empty"],
          statusMap: {
            "not-published": "Nije objavljen",
            "published": "Objavljen",
            "actioned": "Na akciji",
            "featured": "Istaknut",
            "empty": "Nema na stanju",
          },
        },
      },
      {
        title: "Statistika",
        type: "table",
        rows: [
          { label: "Prodato", value: item.statistika.prodato },
          { label: "Vraćeno", value: item.statistika.vraceno },
        ],
      },
      {
        title: "Linkovi",
        type: "custom",
        content: "item-links",
        data: {
          variationsUrl: `/admin/artikli/${item.id}/varijacije`,
          seoUrl: `/admin/artikli/${item.id}/seo`,
        },
      },
      {
        title: "Vreme",
        type: "table",
        rows: [
          { label: "Kreirano", value: item.vreme.kreirano },
          { label: "Ažurirano", value: item.vreme.ažurirano },
        ],
      },
    ],
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Artikli", url: "/admin/artikli" },
      { label: item.osnovno.naziv, url: null },
    ],
  };
}

export function prepareItemFormData(item = null, categories = [], tags = []) {
  const isEdit = !!item;

  const categoryOptions = categories.map(c => ({
    value: c.id || c._id?.toString(),
    label: c.naziv || c.name || c.title || 'Nepoznato'
  }));

  const tagOptions = tags.map(t => ({
    value: t.id || t._id?.toString(),
    label: t.naziv || t.name || t.title || 'Nepoznato'
  }));

  // Preview za sliku
  let previewUrl = null;
  if (item?.slika?.url) {
    previewUrl = `/images/items/${item.slika.url}`;
  }

  // Preview za video
  let videoPreviewHtml = null;
  if (item?.video?.url) {
    // Ako je video URL, prikaži video element
    videoPreviewHtml = `<video src="${item.video.url}" controls style="max-height:100px; width:100%;"></video>`;
  }

  return {
    formAction: isEdit ? `/admin/artikli/${item.id}` : "/admin/artikli",
    formEnctype: "multipart/form-data",
    isEdit,
    submitLabel: isEdit ? "Sačuvaj izmene" : "Kreiraj artikal (Faza 1)",
    cancelUrl: isEdit ? `/admin/artikli/detalji/${item.id}` : "/admin/artikli",
    fields: [
      { name: "title", type: "text", label: "Naziv", required: true, value: item?.osnovno?.naziv || "" },
      { name: "sku", type: "text", label: "SKU", required: true, value: item?.osnovno?.sku || "" },
      { 
        name: "featureImage", 
        type: "file", 
        label: "Istaknuta slika", 
        required: !isEdit,
        accept: "image/jpeg,image/png,image/webp,image/avif",
        preview: previewUrl,
        help: isEdit ? "Ostavite prazno ako ne želite da menjate sliku." : "Preporučena veličina: 1200x800px"
      },
      { name: "featureImageDesc", type: "text", label: "Opis slike", value: item?.slike?.istaknuta?.opis || "" },
      { 
        name: "video", 
        type: "file", 
        label: "Video (MP4, WEBM)", 
        required: false,
        accept: "video/mp4,video/webm",
        previewHtml: videoPreviewHtml,
        help: isEdit ? "Ostavite prazno ako ne želite da menjate video." : "Upload-ujte video fajl (MP4 ili WEBM)"
      },
      { name: "videoDesc", type: "text", label: "Opis videa", value: item?.video?.opis || "" },
      {
        name: "categories",
        type: "multiselect",
        label: "Kategorije",
        value: item?.kategorije?.map(c => c.id) || [],
        options: categoryOptions,
        showEmptyOption: true,
        emptyLabel: "-- Izaberite kategorije --",
        size: 5,
        help: "Držite Ctrl (Cmd) za višestruki odabir"
      },
      {
        name: "tags",
        type: "multiselect",
        label: "Tagovi",
        value: item?.tagovi?.map(t => t.id) || [],
        options: tagOptions,
        showEmptyOption: true,
        emptyLabel: "-- Izaberite tagove --",
        size: 5,
        help: "Držite Ctrl (Cmd) za višestruki odabir"
      },
    ],
    phaseInfo: {
      current: 1,
      total: 3,
      label: "Faza 1: Osnovni podaci",
      nextPhase: isEdit ? `/admin/artikli/${item?.id}/varijacije` : null,
    },
  };
}