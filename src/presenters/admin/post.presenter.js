export function preparePostListData(result, query = {}) {
  return {
    items: result.data,
    columns: [
      { key: "slika", label: "Slika" }, // 🔥 DODATO
      { key: "naziv", label: "Naziv" },
      { key: "slug", label: "Slug" },
      { key: "autor", label: "Autor" },
      { key: "status", label: "Status" },
      { key: "kategorije", label: "Kategorije" },
      { key: "tagovi", label: "Tagovi" },
      { key: "kreiran", label: "Kreiran" },
    ],
    actions: [
      { type: "view", url: "/admin/blog/detalji/", icon: "eye" },
      { type: "edit", url: "/admin/blog/izmena/", icon: "pencil" },
      { 
        type: "custom", 
        url: "/admin/blog/", 
        idKey: "id", 
        subPath: "sadrzaj", 
        icon: "file-text",
        label: "Sadržaj", 
        showLabel: true
      },
      { 
        type: "custom", 
        url: "/admin/blog/", 
        idKey: "id", 
        subPath: "seo", 
        icon: "search", 
        label: "SEO", 
        showLabel: true
      },
      { type: "delete", url: "/admin/blog/", icon: "trash" },
    ],
    pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      basePath: "/admin/blog",
      query,
    },
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Blog postovi", url: null },
    ],
    topbar: {
      createUrl: "/admin/blog/novo",
      createLabel: "Novi post",
      searchUrl: "/admin/blog/pretraga",
      search: query.search || "",
    },
  };
}

export function preparePostDetailsData(post) {
  const statusMap = {
    "not-published": "Nije objavljen",
    "published": "Objavljen",
    "featured": "Istaknut",
  };

  return {
    backUrl: "/admin/blog",
    editUrl: `/admin/blog/izmena/${post.id}`,
    sections: [
      {
        title: "Osnovni podaci",
        type: "table",
        rows: [
          { label: "Naziv", value: post.osnovno.naziv },
          { label: "Slug", value: post.osnovno.slug },
          { label: "Status", value: post.osnovno.status },
          { label: "Autor", value: post.osnovno.autor || "-" },
        ],
      },
      {
        title: "Sadržaj",
        type: "custom",
        content: "post-content",
        data: {
          blocks: post.sadrzaj?.blokovi || [],
          html: post.sadrzaj?.html || "",
          readTime: post.sadrzaj?.vremeCitanja || 0,
        },
      },
      {
        title: "SEO",
        type: "table",
        rows: [
          { label: "Opis", value: post.seo.opis || "-" },
          { label: "Kratak opis", value: post.seo.kratakOpis || "-" },
          { label: "Ključne reči", value: (post.seo.kljucneReci || []).join(", ") || "-" },
        ],
      },
      {
        title: "Kategorije i tagovi",
        type: "table",
        rows: [
          { label: "Kategorije", value: post.kategorije?.map(c => c.naziv).join(", ") || "-" },
          { label: "Tagovi", value: post.tagovi?.map(t => t.naziv).join(", ") || "-" },
        ],
      },
    ],
    sidebar: [
      {
        title: "Status",
        type: "custom",
        content: "status-change-form",
        data: {
          entityId: post.id,
          basePath: "/admin/blog",
          currentStatus: post.osnovno.statusRaw,
          statuses: ["not-published", "published", "featured"],
          statusMap: statusMap,
        },
      },
      {
        title: "Linkovi",
        type: "custom",
        content: "post-links",
        data: {
          contentUrl: `/admin/blog/${post.id}/sadrzaj`,
          seoUrl: `/admin/blog/${post.id}/seo`,
        },
      },
      {
        title: "Vreme",
        type: "table",
        rows: [
          { label: "Kreirano", value: post.vreme.kreirano },
          { label: "Ažurirano", value: post.vreme.ažurirano },
        ],
      },
    ],
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Blog", url: "/admin/blog" },
      { label: post.osnovno.naziv, url: null },
    ],
  };
}

export function preparePostFormData(post = null, categories = [], tags = []) {
  const isEdit = !!post;

  const categoryOptions = categories.map(c => ({
    value: c.id || c._id?.toString(),
    label: c.naziv || c.name || c.title || 'Nepoznato'
  }));

  const tagOptions = tags.map(t => ({
    value: t.id || t._id?.toString(),
    label: t.naziv || t.name || t.title || 'Nepoznato'
  }));

  let previewUrl = null;
  if (post?.slika?.url) {
    previewUrl = `/images/posts/${post.slika.url}`;
  }

  return {
    formAction: isEdit ? `/admin/blog/${post.id}` : "/admin/blog",
    formEnctype: "multipart/form-data",
    isEdit,
    submitLabel: isEdit ? "Sačuvaj izmene" : "Kreiraj post (Faza 1)",
    cancelUrl: isEdit ? `/admin/blog/detalji/${post.id}` : "/admin/blog",
    fields: [
      { 
        name: "title", 
        type: "text", 
        label: "Naziv", 
        required: true, 
        value: post?.osnovno?.naziv || "" 
      },
      { 
        name: "postImage", 
        type: "file", 
        label: "Istaknuta slika", 
        required: !isEdit,
        accept: "image/jpeg,image/png,image/webp,image/avif",
        preview: previewUrl,
        help: isEdit ? "Ostavite prazno ako ne želite da menjate sliku." : "Preporučena veličina: 1200x800px"
      },
      { 
        name: "featureImageDesc", 
        type: "text", 
        label: "Opis slike", 
        value: post?.slika?.opis || "" 
      },
      {
        name: "categories",
        type: "multiselect",
        label: "Kategorije",
        value: post?.kategorije?.map(c => c.id) || [],
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
        value: post?.tagovi?.map(t => t.id) || [],
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
      nextPhase: isEdit ? `/admin/blog/${post?.id}/sadrzaj` : null,
    },
  };
}