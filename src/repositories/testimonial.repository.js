import Testimonial from "../models/testimonial.model.js";
import { buildTestimonialFilter } from "./filters/testimonial.filter.js";
import { resolveLimit, resolveSkip } from "../utils/pagination.util.js";

export async function findTestimonials({
  search,
  rating,
  minRating,
  isApproved,
  isFeatured,
  isActive,
  productId,
  userId,
  ids,
  limit: rawLimit,
  page: rawPage = 1,
  sort = { createdAt: -1 },
  populateFields = null,
  session = null,
} = {}) {
  const limit = resolveLimit(rawLimit);
  const skip = resolveSkip(rawPage, limit);

  const filter = buildTestimonialFilter({
    search, rating, minRating, isApproved, isFeatured, isActive, productId, userId, ids,
  });

  let query = Testimonial.find(filter).sort(sort).skip(skip).limit(limit).lean();
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);

  const countQuery = session
    ? Testimonial.countDocuments(filter).session(session)
    : Testimonial.countDocuments(filter);

  const [data, total] = await Promise.all([query, countQuery]);

  return {
    data, total,
    page: parseInt(rawPage, 10) || 1, limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function findAllTestimonials({
  search, rating, minRating, isApproved, isFeatured, isActive, productId, userId, ids,
  sort = { createdAt: -1 },
  populateFields = null,
  session = null,
} = {}) {
  const filter = buildTestimonialFilter({
    search, rating, minRating, isApproved, isFeatured, isActive, productId, userId, ids,
  });

  let query = Testimonial.find(filter).sort(sort).lean();
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);

  return query;
}

export async function findPublicTestimonials(options = {}) {
  return findAllTestimonials({ ...options, isApproved: true, isActive: true });
}

export async function findFeaturedTestimonials(limit = 6) {
  return findAllTestimonials({
    isApproved: true,
    isActive: true,
    isFeatured: true,
    sort: { createdAt: -1 },
    limit,
  });
}

export async function findTestimonialById(id, populateFields = null, session = null) {
  let query = Testimonial.findById(id).lean();
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);
  return query;
}

export async function findTestimonialByUserAndProduct(userId, productId, session = null) {
  let query = Testimonial.findOne({ user: userId, "product.itemId": productId }).lean();
  if (session) query = query.session(session);
  return query;
}

export async function createTestimonial(data, session = null) {
  const testimonial = new Testimonial(data);
  return testimonial.save({ session });
}

export async function updateTestimonialById(id, data, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;
  return Testimonial.findByIdAndUpdate(id, { $set: data }, opts).lean();
}

export async function approveTestimonial(id, approvedBy, session = null) {
  const opts = { new: true };
  if (session) opts.session = session;
  return Testimonial.findByIdAndUpdate(
    id,
    {
      $set: {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy,
      },
    },
    opts
  ).lean();
}

export async function toggleFeatured(id, isFeatured, session = null) {
  const opts = { new: true };
  if (session) opts.session = session;
  return Testimonial.findByIdAndUpdate(id, { $set: { isFeatured } }, opts).lean();
}

export async function deleteTestimonialById(id, session = null) {
  const opts = session ? { session } : {};
  return Testimonial.findByIdAndDelete(id, opts).lean();
}

export async function countTestimonials(filter = {}) {
  return Testimonial.countDocuments(filter);
}

export async function getAverageRating(filter = {}) {
  const result = await Testimonial.aggregate([
    { $match: { ...filter, isApproved: true, isActive: true } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  return result[0] || { average: 0, count: 0 };
}

export default {
  findTestimonials, findAllTestimonials,
  findPublicTestimonials, findFeaturedTestimonials,
  findTestimonialById, findTestimonialByUserAndProduct,
  createTestimonial, updateTestimonialById,
  approveTestimonial, toggleFeatured,
  deleteTestimonialById,
  countTestimonials, getAverageRating,
};