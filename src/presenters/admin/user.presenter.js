export function prepareUserListData(result, query = {}) {
  return {
    items: result.data,
    columns: [
      { key: "email", label: "Email" },
      { key: "ime", label: "Ime" },
      { key: "prezime", label: "Prezime" },
      { key: "rola", label: "Rola" },
      { key: "status", label: "Status" },
      { key: "provider", label: "Provider" },
      { key: "potvrđen", label: "Potvrđen" },
      { key: "partner", label: "Partner" },
      { key: "brojPorudzbina", label: "Porudžbine" },
      { key: "kreiran", label: "Kreiran" },
    ],
    actions: [
      { type: "view", url: "/admin/korisnici/detalji/", icon: "eye" },
      { type: "edit", url: "/admin/korisnici/izmena/", icon: "pencil" },
      { type: "delete", url: "/admin/korisnici/", icon: "trash" },
    ],
    pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      basePath: "/admin/korisnici",
      query,
    },
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Korisnici", url: null },
    ],
    topbar: {
      searchUrl: "/admin/korisnici/pretraga",
      search: query.search || "",
      filters: [
        {
          type: "select",
          name: "status",
          label: "Status",
          value: query.status || "",
          options: [
            { value: "", label: "Svi statusi" },
            { value: "pending", label: "Na čekanju" },
            { value: "active", label: "Aktivan" },
            { value: "inactive", label: "Neaktivan" },
            { value: "suspended", label: "Suspendovan" },
          ],
        },
      ],
    },
  };
}

export function prepareUserDetailsData(user, roles = []) {
  // Mapiramo role za dropdown
  const roleOptions = roles.map((r) => ({
    value: r.id,
    label: r.naziv,
  }));

  // Pronađi naziv trenutne role
  const currentRole = roles.find((r) => r.id === user.osnovno.rolaRaw);
  const currentRoleName = currentRole ? currentRole.naziv : (user.osnovno.rola || 'Nepoznata');

  // Priprema sekcija
  const sections = [
    {
      title: "Osnovni podaci",
      type: "table",
      rows: [
        { label: "Email", value: user.osnovno.email },
        { label: "Ime", value: `${user.osnovno.ime} ${user.osnovno.prezime}` },
        {
          label: "Avatar",
          value: user.osnovno.avatar
            ? `<img src="${user.osnovno.avatar}" width="50">`
            : "-",
        },
        { label: "Rola", value: currentRoleName },
        { label: "Status", value: user.osnovno.status },
        { label: "Provider", value: user.osnovno.provider },
        { label: "Potvrđen", value: user.osnovno.potvrđen },
        { label: "Prihvaćeno", value: user.osnovno.prihvaćeno },
      ],
    },
    {
      title: "Kontakt",
      type: "table",
      rows: [
        {
          label: "Telefoni",
          value: user.kontakt?.telefoni?.map((t) => t.value).join(", ") || "-",
        },
        {
          label: "Adrese",
          value:
            user.kontakt?.adrese
              ?.map((a) => `${a.street} ${a.number}, ${a.city}`)
              .join(" | ") || "-",
        },
      ],
    },
    {
      title: "Porudžbine",
      type: "table",
      rows: [{ label: "Ukupno", value: user.porudzbine.ukupno }],
    },
  ];

  // Dodajemo sekciju za partnerstvo
  if (user.partner?.isPartner) {
    const partnerRows = [
      { label: "Status", value: "Aktivan" },
      // Slug red
      {
        label: "Slug",
        value: user.partner.slug
          ? `<a href="/partner/${user.partner.slug}/prodavnica" target="_blank" class="text-decoration-none">/partner/${user.partner.slug}/prodavnica</a>`
          : "Nije postavljen"
      },
      { label: "Novčanik", value: `${user.partner.novčanik || 0} RSD` },
      { label: "Nivo", value: user.partner.rank?.nivo || 0 },
      { label: "Poeni", value: user.partner.rank?.poeni || 0 },
      { label: "Popust", value: user.partner.rank?.popust || "0%" },
      { label: "Max ponuda", value: user.partner.rank?.maxPonuda || 1 },
      { label: "Shop status", value: user.partner.shopStatus ? "Aktivan" : "Neaktivan" },
      { label: "Affiliate ponude", value: (user.partner.affiliatePonude || []).length },
    ];

    // Ako postoji logo, dodajemo red sa slikom (posle Statusa, pre Sluga)
    if (user.partner.shopLogo) {
      partnerRows.splice(1, 0, {
        label: "Logo",
        value: `<img src="${user.partner.shopLogo}" alt="Logo" style="max-height:60px; border-radius:4px;">`,
      });
    }

    sections.push({
      title: "Partnerstvo",
      type: "table",
      rows: partnerRows,
    });
  } else {
    sections.push({
      title: "Partnerstvo",
      type: "table",
      rows: [{ label: "Status", value: "Nije partner" }],
    });
  }

  return {
    backUrl: "/admin/korisnici",
    editUrl: `/admin/korisnici/izmena/${user.id}`,
    sections: sections,
    sidebar: [
      {
        title: "Akcije",
        type: "custom",
        content: "user-actions",
        data: {
          userId: user.id,
          currentStatus: user.osnovno.statusRaw,
          isConfirmed: user.osnovno.potvrđenRaw,
          currentRoleId: user.osnovno.rolaRaw,
          currentRoleName: currentRoleName,
          roleOptions: roleOptions,
          isPartner: user.partner?.isPartner || false,
        },
      },
      {
        title: "Vreme",
        type: "table",
        rows: [
          { label: "Kreirano", value: user.vreme.kreirano },
          { label: "Ažurirano", value: user.vreme.ažurirano },
          { label: "Poslednji login", value: user.vreme.poslednjiLogin },
        ],
      },
    ],
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Korisnici", url: "/admin/korisnici" },
      { label: user.osnovno.email, url: null },
    ],
  };
}

export function prepareUserFormData(user = null) {
  const isEdit = !!user;

  return {
    formAction: isEdit ? `/admin/korisnici/${user.id}` : "/admin/korisnici",
    isEdit,
    submitLabel: isEdit ? "Sačuvaj izmene" : "Kreiraj korisnika",
    cancelUrl: isEdit ? `/admin/korisnici/detalji/${user.id}` : "/admin/korisnici",
    fields: [
      {
        name: "email",
        type: "email",
        label: "Email",
        required: true,
        value: user?.osnovno?.email || "",
      },
      {
        name: "firstName",
        type: "text",
        label: "Ime",
        required: true,
        value: user?.osnovno?.ime || "",
      },
      {
        name: "lastName",
        type: "text",
        label: "Prezime",
        required: true,
        value: user?.osnovno?.prezime || "",
      },
      {
        name: "acceptance",
        type: "checkbox",
        label: "Prihvaćeno",
        value: user?.osnovno?.prihvaćeno === "Da",
      },
    ],
  };
}