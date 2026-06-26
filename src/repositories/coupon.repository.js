import Coupon from "../models/coupon.model.js";
import { buildCouponFilter } from "./filters/coupon.filter.js";
import { resolveLimit, resolveSkip } from "../utils/pagination.util.js";

export async function findCoupons({
  search,
  code,
  isActive,
  discountType,
  isValid,
  isExpired,
  ids,
  limit: rawLimit,
  page: rawPage = 1,
  sort = { createdAt: -1 },
  populateFields = null,
  session = null,
} = {}) {
  const limit = resolveLimit(rawLimit);
  const skip = resolveSkip(rawPage, limit);

  const filter = buildCouponFilter({
    search,
    code,
    isActive,
    discountType,
    isValid,
    isExpired,
    ids,
  });

  let query = Coupon.find(filter)
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
    ? Coupon.countDocuments(filter).session(session)
    : Coupon.countDocuments(filter);

  const [data, total] = await Promise.all([query, countQuery]);

  return {
    data,
    total,
    page: parseInt(rawPage, 10) || 1,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function findAllCoupons({
  search,
  code,
  isActive,
  discountType,
  isValid,
  ids,
  sort = { createdAt: -1 },
  populateFields = null,
  session = null,
} = {}) {
  const filter = buildCouponFilter({
    search,
    code,
    isActive,
    discountType,
    isValid,
    ids,
  });

  let query = Coupon.find(filter)
    .sort(sort)
    .lean();

  if (populateFields) {
    query = query.populate(populateFields);
  }

  if (session) {
    query = query.session(session);
  }

  return query;
}

export async function findValidCoupons(session = null) {
  return findAllCoupons({ isValid: true, isActive: true, session });
}

export async function findCouponById(id, populateFields = null, session = null) {
  let query = Coupon.findById(id)
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);
  return query;
}

export async function findCouponByCode(code, session = null) {
  if (!code) return null;

  let query = Coupon.findOne({
    code: code.toUpperCase().trim(),
  }).lean();

  if (session) query = query.session(session);
  return query;
}

export async function createCoupon(data, session = null) {
  const coupon = new Coupon(data);
  return coupon.save({ session });
}

export async function updateCouponById(id, data, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;
  return Coupon.findByIdAndUpdate(id, { $set: data }, opts).lean();
}

export async function deleteCouponById(id, session = null) {
  const opts = session ? { session } : {};
  return Coupon.findByIdAndDelete(id, opts).lean();
}

export async function incrementUsedCount(id, session = null) {
  const opts = session ? { session } : {};
  return Coupon.findByIdAndUpdate(
    id,
    { $inc: { usedCount: 1 } },
    { new: true, ...opts }
  ).lean();
}

export async function addUserToCoupon(id, userId, orderId, session = null) {
  const opts = session ? { session } : {};
  return Coupon.findByIdAndUpdate(
    id,
    {
      $push: {
        usedBy: {
          userId,
          orderId,
          usedAt: new Date(),
        },
      },
      $inc: { usedCount: 1 },
    },
    { new: true, ...opts }
  ).lean();
}

export async function countCoupons(filter = {}) {
  return Coupon.countDocuments(filter);
}

export async function countCouponsByStatus() {
  const result = await Coupon.aggregate([
    { $group: { _id: "$isActive", count: { $sum: 1 } } },
  ]);

  return {
    active: result.find((r) => r._id === true)?.count || 0,
    inactive: result.find((r) => r._id === false)?.count || 0,
  };
}

export async function countCouponsByType() {
  const result = await Coupon.aggregate([
    { $group: { _id: "$discountType", count: { $sum: 1 } } },
  ]);

  return {
    percentage: result.find((r) => r._id === "percentage")?.count || 0,
    fixed: result.find((r) => r._id === "fixed")?.count || 0,
  };
}

export async function getTotalCouponUsage() {
  const result = await Coupon.aggregate([
    { $group: { _id: null, total: { $sum: "$usedCount" } } },
  ]);

  return result[0]?.total || 0;
}

export async function getCouponRawByCode(code, session = null) {
  if (!code) return null;
  return couponRepo.findCouponByCode(code, session);
}

export default {
  findCoupons,
  findAllCoupons,
  findValidCoupons,
  findCouponById,
  findCouponByCode,
  createCoupon,
  updateCouponById,
  deleteCouponById,
  incrementUsedCount,
  addUserToCoupon,
  countCoupons,
  countCouponsByStatus,
  countCouponsByType,
  getTotalCouponUsage,
  getCouponRawByCode,
};