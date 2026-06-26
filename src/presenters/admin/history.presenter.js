import { HISTORY_TYPES } from "../../models/history.model.js";

export function prepareHistoryListData(result, query = {}) {
  return {
    items: result.data,
    columns: [
      { key: "partnerName", label: "Partner" },
      { key: "type", label: "Tip" },
      { key: "amountFormatted", label: "Iznos" },
      { key: "description", label: "Opis" },
      { key: "createdAt", label: "Datum" },
    ],
    actions: [
      { type: "view", url: "/admin/istorija/detalji/", icon: "eye" },
      { type: "delete", url: "/admin/istorija/", icon: "trash" },
    ],
    pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      basePath: "/admin/istorija",
      query,
    },
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Istorija partnera", url: null },
    ],
    topbar: {
      searchUrl: "/admin/istorija/pretraga",
      search: query.search || "",
      filters: [
        {
          type: "select",
          name: "type",
          label: "Tip",
          value: query.type || "",
          options: [
            { value: "", label: "Svi tipovi" },
            ...HISTORY_TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, ' ') })),
          ],
        },
        {
          type: "text",
          name: "partnerId",
          label: "Partner ID",
          value: query.partnerId || "",
          placeholder: "Unesite ID partnera",
        },
        {
          type: "date",
          name: "fromDate",
          label: "Od datuma",
          value: query.fromDate || "",
        },
        {
          type: "date",
          name: "toDate",
          label: "Do datuma",
          value: query.toDate || "",
        },
        {
          type: "number",
          name: "minAmount",
          label: "Min. iznos",
          value: query.minAmount || "",
        },
        {
          type: "number",
          name: "maxAmount",
          label: "Max. iznos",
          value: query.maxAmount || "",
        },
      ],
    },
  };
}

export function prepareHistoryDetailsData(history) {
  return {
    backUrl: "/admin/istorija",
    sections: [
      {
        title: "Osnovni podaci",
        type: "table",
        rows: [
          { label: "Partner", value: history.partner.name },
          { label: "Tip", value: history.type },
          { label: "Iznos", value: history.amountFormatted },
          { label: "Opis", value: history.description || "-" },
          { label: "Porudžbina", value: history.orderId ? `<a href="/admin/porudzbine/detalji/${history.orderId}">#${history.orderId}</a>` : "-" },
          { label: "Dodatni podaci", value: history.metadata && Object.keys(history.metadata).length > 0 ? JSON.stringify(history.metadata, null, 2) : "-" },
        ],
      },
    ],
    sidebar: [
      {
        title: "Vreme",
        type: "table",
        rows: [
          { label: "Kreirano", value: history.createdAt },
          { label: "Ažurirano", value: history.updatedAt },
        ],
      },
    ],
    breadcrumbs: [
      { label: "Admin", url: "/admin" },
      { label: "Istorija partnera", url: "/admin/istorija" },
      { label: `${history.partner.name} - ${history.type}`, url: null },
    ],
  };
}