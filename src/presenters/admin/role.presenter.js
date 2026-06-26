import { PERMISSIONS } from "../../models/role.model.js";
import { translatePermission } from "../../mappers/role.mapper.js";

export function prepareRoleListData(result, query = {}) {
  return {
    items: result.data,
    columns: [
      { key: "naziv", label: "Naziv" },
      { key: "opis", label: "Opis" },
      { key: "brojPermisija", label: "Permisije" },
      { key: "podrazumevana", label: "Podrazumevana" },
      { key: "aktivna", label: "Aktivna" },
      { key: "prioritet", label: "Prioritet" },
      { key: "kreirana", label: "Kreirana" },
    ],
    actions: [
      { type: "view", url: "/admin/uloge/detalji/", icon: "eye" },
      { type: "edit", url: "/admin/uloge/izmena/", icon: "pencil" },
      { type: "delete", url: "/admin/uloge/", icon: "trash" },
    ],
    pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      basePath: "/admin/uloge",
      query,
    },
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Role", url: null },
    ],
    topbar: {
      createUrl: "/admin/uloge/novo",
      createLabel: "Nova rola",
      searchUrl: "/admin/uloge/pretraga",
      search: query.search || "",
    },
  };
}

export function prepareRoleDetailsData(role) {
  return {
    backUrl: "/admin/uloge",
    editUrl: `/admin/uloge/izmena/${role.id}`,
    sections: [
      {
        title: "Osnovni podaci",
        type: "table",
        rows: [
          { label: "Naziv", value: role.osnovno.naziv },
          { label: "Opis", value: role.osnovno.opis || "-" },
          { label: "Podrazumevana", value: role.osnovno.podrazumevana ? "Da" : "Ne" },
          { label: "Aktivna", value: role.osnovno.aktivna ? "Da" : "Ne" },
          { label: "Prioritet", value: role.osnovno.prioritet },
        ],
      },
      {
        title: `Permisije (${role.permisije.length})`,
        type: "list",
        itemType: "permission",
        items: role.permisije,
      },
    ],
    sidebar: [
      {
        title: "Vreme",
        type: "table",
        rows: [
          { label: "Kreirano", value: role.vreme.kreirano },
          { label: "Ažurirano", value: role.vreme.ažurirano },
        ],
      },
    ],
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Role", url: "/admin/uloge" },
      { label: role.osnovno.naziv, url: null },
    ],
  };
}

export function prepareRoleFormData(role = null) {
  const isEdit = !!role;

  // Generišemo opcije za permisije – prevodimo svaki kod u naziv
  const permissionOptions = PERMISSIONS.map((p) => ({
    value: p,
    label: translatePermission(p),
  }));

  return {
    formAction: isEdit ? `/admin/uloge/${role.id}` : "/admin/uloge",
    isEdit,
    submitLabel: isEdit ? "Sačuvaj izmene" : "Kreiraj rolu",
    cancelUrl: isEdit ? `/admin/uloge/detalji/${role.id}` : "/admin/uloge",
    fields: [
      { name: "name", type: "text", label: "Naziv", required: true, value: role?.osnovno?.naziv || "" },
      { name: "description", type: "textarea", label: "Opis", value: role?.osnovno?.opis || "" },
      { name: "isDefault", type: "checkbox", label: "Podrazumevana", value: role?.osnovno?.podrazumevana || false },
      { name: "isActive", type: "checkbox", label: "Aktivna", value: role?.osnovno?.aktivna !== false },
      {
        name: "priority",
        type: "number",
        label: "Prioritet",
        value: role?.osnovno?.prioritet ?? 0,
        default: 0,
        min: 0,
        max: 1000,
        step: 1,
        placeholder: `Unesite prioritet (veći = važniji)`,
        help: "Veći broj znači veći prioritet pri dodeli uloge korisnicima."
      },
      {
        name: "permissions",
        type: "checkbox-group",
        label: "Permisije",
        value: role?.permisije?.map((p) => p.kod) || [],
        options: permissionOptions,
      },
    ],
  };
}