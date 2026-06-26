import { formatDateTime } from "../utils/date.time.util.js";

function translateType(type) {
  const map = {
    earnings: "Zarada",
    withdrawal: "Isplata",
    level_up: "Podizanje nivoa",
    bonus: "Bonus",
    adjustment: "Korekcija",
    shop_activation: "Aktivacija prodavnice",
    offer_created: "Kreirana ponuda",
  };
  return map[type] || type;
}

function translateAmount(amount, type) {
  const sign = type === "earnings" || type === "bonus" || type === "adjustment" ? "+" : "";
  return `${sign}${amount} RSD`;
}

export function mapHistoryForAdminList(history) {
  if (!history) return null;

  return {
    id: history._id.toString(),
    partnerId: history.partnerId?.toString() || null,
    partnerName: history.partnerId?.firstName && history.partnerId?.lastName
      ? `${history.partnerId.firstName} ${history.partnerId.lastName}`
      : history.partnerId?.email || "Nepoznat",
    type: translateType(history.type),
    typeRaw: history.type,
    amount: history.amount,
    amountFormatted: translateAmount(history.amount, history.type),
    description: history.description || "-",
    orderId: history.orderId?.toString() || null,
    metadata: history.metadata || {},
    createdAt: formatDateTime(history.createdAt),
    updatedAt: formatDateTime(history.updatedAt),
  };
}

export function mapHistoryForAdminDetail(history) {
  if (!history) return null;

  return {
    id: history._id.toString(),
    partner: {
      id: history.partnerId?.toString() || null,
      name: history.partnerId?.firstName && history.partnerId?.lastName
        ? `${history.partnerId.firstName} ${history.partnerId.lastName}`
        : history.partnerId?.email || "Nepoznat",
    },
    type: translateType(history.type),
    typeRaw: history.type,
    amount: history.amount,
    amountFormatted: translateAmount(history.amount, history.type),
    description: history.description || "-",
    orderId: history.orderId?.toString() || null,
    metadata: history.metadata || {},
    createdAt: formatDateTime(history.createdAt),
    updatedAt: formatDateTime(history.updatedAt),
  };
}

export function mapHistoriesForAdminList(histories = []) {
  return histories.map(mapHistoryForAdminList).filter(Boolean);
}

export function mapHistoryRaw(history) {
  return history;
}

export default {
  mapHistoryForAdminList,
  mapHistoryForAdminDetail,
  mapHistoriesForAdminList,
  mapHistoryRaw,
};