import * as historyRepo from "../repositories/history.repository.js";
import { mapHistoriesForAdminList, mapHistoryForAdminDetail } from "../mappers/history.mapper.js";
import { validationError, notFound } from "../utils/error.util.js";

export async function listHistory({
  search,
  partnerId,
  type,
  fromDate,
  toDate,
  minAmount,
  maxAmount,
  limit = 10,
  page = 1,
} = {}) {
  const result = await historyRepo.findHistory({
    search,
    partnerId,
    type,
    fromDate,
    toDate,
    minAmount,
    maxAmount,
    limit,
    page,
    sort: { createdAt: -1 },
    populateFields: ["partnerId"],
  });

  return {
    data: mapHistoriesForAdminList(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getHistoryById(historyId) {
  if (!historyId) validationError("historyId");

  const history = await historyRepo.findHistoryById(historyId, ["partnerId"]);
  if (!history) notFound("Istorija");

  return mapHistoryForAdminDetail(history);
}

export async function createHistory(data) {
  if (!data) validationError("data");
  if (!data.partnerId) validationError("partnerId");
  if (!data.type) validationError("type");

  const created = await historyRepo.createHistory(data);
  const historyObject = created.toObject ? created.toObject() : created;
  return mapHistoryForAdminDetail(historyObject);
}

export async function createManyHistory(dataArray) {
  if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
    validationError("dataArray must be a non-empty array");
  }

  const created = await historyRepo.createManyHistory(dataArray);
  return created.map(doc => mapHistoryForAdminDetail(doc.toObject ? doc.toObject() : doc));
}

export async function updateHistory(historyId, data) {
  if (!historyId) validationError("historyId");
  if (!data || Object.keys(data).length === 0) validationError("data");

  const updated = await historyRepo.updateHistoryById(historyId, data);
  if (!updated) notFound("Istorija");

  return mapHistoryForAdminDetail(updated);
}

export async function deleteHistory(historyId) {
  if (!historyId) validationError("historyId");

  const deleted = await historyRepo.deleteHistoryById(historyId);
  if (!deleted) notFound("Istorija");

  return { deleted: true, id: historyId };
}

export async function getHistoryStats({ partnerId, fromDate, toDate } = {}) {
  return historyRepo.getHistoryStats({ partnerId, fromDate, toDate });
}

export default {
  listHistory,
  getHistoryById,
  createHistory,
  createManyHistory,
  updateHistory,
  deleteHistory,
  getHistoryStats,
};