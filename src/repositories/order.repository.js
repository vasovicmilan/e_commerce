import Order from "../models/order.model.js";
import { buildOrderFilter } from "./filters/order.filter.js";
import { resolveLimit, resolveSkip } from "../utils/pagination.util.js";
import { getStatusTimestampField } from "../models/order-status-transitions.js";

export async function findOrders({
  search, buyerId, buyerModel, email, status, statuses, city,
  dateFrom, dateTo, minTotal, maxTotal, partnerId, source, ids,
  limit: rawLimit, page: rawPage = 1,
  sort = { createdAt: -1 },
  populateFields = null,
  session = null,
} = {}) {
  const limit = resolveLimit(rawLimit);
  const skip = resolveSkip(rawPage, limit);

  const filter = buildOrderFilter({
    search, buyerId, buyerModel, email, status, statuses, city,
    dateFrom, dateTo, minTotal, maxTotal, partnerId, source, ids,
  });

  let query = Order.find(filter).sort(sort).skip(skip).limit(limit).lean();
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);

  const countQuery = session
    ? Order.countDocuments(filter).session(session)
    : Order.countDocuments(filter);

  const [data, total] = await Promise.all([query, countQuery]);

  return {
    data, total,
    page: parseInt(rawPage, 10) || 1, limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function findAllOrders({
  search, buyerId, buyerModel, email, status, statuses, city,
  partnerId, source, ids,
  sort = { createdAt: -1 },
  populateFields = null,
  session = null,
} = {}) {
  const filter = buildOrderFilter({
    search, buyerId, buyerModel, email, status, statuses, city,
    partnerId, source, ids,
  });

  let query = Order.find(filter).sort(sort).lean();
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);

  return query;
}

export async function findOrderById(id, populateFields = null, session = null) {
  let query = Order.findById(id).lean();
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);
  return query;
}

export async function findOrderByCancelToken(token, session = null) {
  if (!token) return null;
  let query = Order.findOne({ cancelToken: token }).lean();
  if (session) query = query.session(session);
  return query;
}

export async function findOrdersByBuyer(buyerId, options = {}) {
  return findOrders({ ...options, buyerId });
}

export async function findOrdersByPartner(partnerId, options = {}) {
  return findOrders({ ...options, partnerId, source: "partner_shop" });
}

export async function createOrder(data, session = null) {
  const order = new Order(data);
  return order.save({ session });
}

export async function updateOrderById(id, data, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;
  return Order.findByIdAndUpdate(id, { $set: data }, opts).lean();
}

export async function updateOrderStatus(id, status, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;

  const timestampField = getStatusTimestampField(status);
  const updateData = { status };
  if (timestampField) updateData[timestampField] = new Date();

  return Order.findByIdAndUpdate(id, { $set: updateData }, opts).lean();
}

/**
 * Ažurira više order-a odjednom.
 * Koristi se za migraciju Customer → User.
 */
export async function updateManyOrders(filter, updateData, session = null) {
  const opts = session ? { session } : {};
  return Order.updateMany(filter, { $set: updateData }, opts);
}

export async function deleteOrderById(id, session = null) {
  const opts = session ? { session } : {};
  return Order.findByIdAndDelete(id, opts).lean();
}

export async function countOrders(filter = {}) {
  return Order.countDocuments(filter);
}

export async function countOrdersByStatus() {
  const result = await Order.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts = {};
  for (const row of result) counts[row._id] = row.count;
  return counts;
}

export async function getTotalRevenue({ statuses = null } = {}) {
  const match = {};
  if (statuses && Array.isArray(statuses) && statuses.length) {
    match.status = { $in: statuses };
  }
  
  const result = await Order.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$totalPrice" } } }
  ]);
  return result.length ? result[0].total : 0;
}

export async function getRevenueByPeriod(days = 30, { statuses = null } = {}) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const match = { createdAt: { $gte: since } };
  if (statuses && Array.isArray(statuses) && statuses.length) {
    match.status = { $in: statuses };
  }
  const result = await Order.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
  ]);
  return result.length ? result[0] : { total: 0, count: 0 };
}

export async function getRevenueByPartner(partnerId) {
  const result = await Order.aggregate([
    {
      $match: {
        "partner.partnerId": partnerId,
        status: { $nin: ["cancelled", "failed", "refunded"] },
      },
    },
    { $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } } },
  ]);
  return result[0] || { total: 0, count: 0 };
}

export default {
  findOrders,
  findAllOrders,
  findOrderById,
  findOrderByCancelToken,
  findOrdersByBuyer,
  findOrdersByPartner,
  createOrder,
  updateOrderById,
  updateOrderStatus,
  updateManyOrders,
  deleteOrderById,
  countOrders,
  countOrdersByStatus,
  getTotalRevenue,
  getRevenueByPeriod,
  getRevenueByPartner,
};