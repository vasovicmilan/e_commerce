import TemporaryOrder from "../models/temporary.order.model.js";
import { buildTemporaryOrderFilter } from "./filters/temporary.order.filter.js";
import { resolveLimit, resolveSkip } from "../utils/pagination.util.js";

export async function findTemporaryOrders({
  buyerId,
  buyerModel,
  email,
  partnerId,
  source,
  limit: rawLimit,
  page: rawPage = 1,
  sort = { createdAt: -1 },
  populateFields = null,
  session = null,
} = {}) {
  const limit = resolveLimit(rawLimit);
  const skip = resolveSkip(rawPage, limit);

  const filter = buildTemporaryOrderFilter({ buyerId, buyerModel, email, partnerId, source });

  let query = TemporaryOrder.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);

  const countQuery = session
    ? TemporaryOrder.countDocuments(filter).session(session)
    : TemporaryOrder.countDocuments(filter);

  const [data, total] = await Promise.all([query, countQuery]);

  return {
    data,
    total,
    page: parseInt(rawPage, 10) || 1,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function findAllTemporaryOrders({
  buyerId,
  buyerModel,
  email,
  partnerId,
  source,
  sort = { createdAt: -1 },
  populateFields = null,
  session = null,
} = {}) {
  const filter = buildTemporaryOrderFilter({ buyerId, buyerModel, email, partnerId, source });

  let query = TemporaryOrder.find(filter)
    .sort(sort)
    .lean();

  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);

  return query;
}

export async function findTemporaryOrderById(id, session = null) {
  let query = TemporaryOrder.findById(id).lean();
  if (session) query = query.session(session);
  return query;
}

export async function findTemporaryOrderByToken(token, session = null) {
  if (!token) return null;
  let query = TemporaryOrder.findOne({ verificationToken: token }).lean();
  if (session) query = query.session(session);
  return query;
}

export async function createTemporaryOrder(data, session = null) {
  const order = new TemporaryOrder(data);
  return order.save({ session });
}

export async function updateTemporaryOrderById(id, data, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;
  return TemporaryOrder.findByIdAndUpdate(id, { $set: data }, opts).lean();
}

export async function deleteTemporaryOrderById(id, session = null) {
  const opts = session ? { session } : {};
  return TemporaryOrder.findByIdAndDelete(id, opts).lean();
}

export async function countTemporaryOrders(filter = {}) {
  return TemporaryOrder.countDocuments(filter);
}

export default {
  findTemporaryOrders,
  findAllTemporaryOrders,
  findTemporaryOrderById,
  findTemporaryOrderByToken,
  createTemporaryOrder,
  updateTemporaryOrderById,
  deleteTemporaryOrderById,
  countTemporaryOrders,
};