import History from "../models/history.model.js";
import { buildHistoryFilter } from "./filters/history.filter.js";
import { resolveLimit, resolveSkip } from "../utils/pagination.util.js";

export async function findHistory({
  search,
  partnerId,
  type,
  fromDate,
  toDate,
  minAmount,
  maxAmount,
  ids,
  limit: rawLimit,
  page: rawPage = 1,
  sort = { createdAt: -1 },
  populateFields = null,
  session = null,
} = {}) {
  const limit = resolveLimit(rawLimit);
  const skip = resolveSkip(rawPage, limit);

  const filter = buildHistoryFilter({
    search,
    partnerId,
    type,
    fromDate,
    toDate,
    minAmount,
    maxAmount,
    ids,
  });

  let query = History.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  if (populateFields) {
    query = query.populate(populateFields);
  }

  if (session) {
    query = query.session(session);
  }

  const countQuery = session
    ? History.countDocuments(filter).session(session)
    : History.countDocuments(filter);

  const [data, total] = await Promise.all([query, countQuery]);

  return {
    data,
    total,
    page: parseInt(rawPage, 10) || 1,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function findAllHistory({
  search,
  partnerId,
  type,
  fromDate,
  toDate,
  minAmount,
  maxAmount,
  ids,
  sort = { createdAt: -1 },
  populateFields = null,
  session = null,
} = {}) {
  const filter = buildHistoryFilter({
    search,
    partnerId,
    type,
    fromDate,
    toDate,
    minAmount,
    maxAmount,
    ids,
  });

  let query = History.find(filter).sort(sort).lean();

  if (populateFields) {
    query = query.populate(populateFields);
  }

  if (session) {
    query = query.session(session);
  }

  return query;
}

export async function findHistoryById(id, populateFields = null, session = null) {
  let query = History.findById(id).lean();
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);
  return query;
}

export async function createHistory(data, session = null) {
  const history = new History(data);
  return history.save({ session });
}

export async function createManyHistory(dataArray, session = null) {
  return History.insertMany(dataArray, { session });
}

export async function updateHistoryById(id, data, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;
  return History.findByIdAndUpdate(id, { $set: data }, opts).lean();
}

export async function deleteHistoryById(id, session = null) {
  const opts = session ? { session } : {};
  return History.findByIdAndDelete(id, opts).lean();
}

export async function countHistory(filter = {}) {
  return History.countDocuments(filter);
}

export async function getHistoryStats({ partnerId, fromDate, toDate } = {}) {
  const filter = {};
  if (partnerId) filter.partnerId = partnerId;
  if (fromDate) filter.createdAt = { $gte: new Date(fromDate) };
  if (toDate) {
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    filter.createdAt = { ...filter.createdAt, $lte: to };
  }

  const stats = await History.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: { $cond: [{ $eq: ["$type", "earnings"] }, "$amount", 0] } },
        totalWithdrawals: { $sum: { $cond: [{ $eq: ["$type", "withdrawal"] }, "$amount", 0] } },
        totalBonuses: { $sum: { $cond: [{ $eq: ["$type", "bonus"] }, "$amount", 0] } },
        totalAdjustments: { $sum: { $cond: [{ $eq: ["$type", "adjustment"] }, "$amount", 0] } },
        count: { $sum: 1 },
      },
    },
  ]);

  return stats.length > 0 ? stats[0] : {
    totalEarnings: 0,
    totalWithdrawals: 0,
    totalBonuses: 0,
    totalAdjustments: 0,
    count: 0,
  };
}

export default {
  findHistory,
  findAllHistory,
  findHistoryById,
  createHistory,
  createManyHistory,
  updateHistoryById,
  deleteHistoryById,
  countHistory,
  getHistoryStats,
};