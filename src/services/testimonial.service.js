import eventEmitter from "../events/event.emitter.js";
import * as testimonialRepo from "../repositories/testimonial.repository.js";
import {
  mapTestimonialsForAdminList,
  mapTestimonialForAdminDetail,
  mapTestimonialsForPublic,
} from "../mappers/testimonial.mapper.js";
import {
  validationError,
  notFound,
  badRequest,
} from "../utils/error.util.js";

export async function listTestimonials({
  search,
  rating,
  minRating,
  isApproved,
  isFeatured,
  isActive,
  productId,
  userId,
  limit = 10,
  page = 1,
} = {}) {
  const result = await testimonialRepo.findTestimonials({
    search, rating, minRating, isApproved, isFeatured, isActive, productId, userId,
    limit, page,
    sort: { createdAt: -1 },
    populateFields: ["user"],
  });

  return {
    data: mapTestimonialsForAdminList(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getTestimonialById(testimonialId) {
  if (!testimonialId) validationError("testimonialId");

  const testimonial = await testimonialRepo.findTestimonialById(testimonialId, ["user"]);
  if (!testimonial) notFound("Testimonial");

  return mapTestimonialForAdminDetail(testimonial);
}

export async function submitTestimonial(data) {
  if (!data) validationError("data");
  if (!data.rating) validationError("rating");
  if (!data.comment) validationError("comment");

  const testimonialData = {
    user: data.user || null,
    displayName: data.displayName || "",
    email: data.email || "",
    avatar: data.avatar || "",
    rating: data.rating,
    title: data.title || "",
    comment: data.comment,
    product: data.product || {},
    isApproved: false,
    isFeatured: false,
    isActive: true,
  };

  const created = await testimonialRepo.createTestimonial(testimonialData);

  eventEmitter.emit("testimonial:submitted", {
    id: created._id.toString(),
    email: data.email,
    displayName: data.displayName,
    rating: data.rating,
    title: data.title,
    comment: data.comment,
  });

  return { id: created._id.toString(), submitted: true };
}

export async function approveTestimonial(testimonialId, approvedBy) {
  if (!testimonialId) validationError("testimonialId");
  if (!approvedBy) validationError("approvedBy");

  const updated = await testimonialRepo.approveTestimonial(testimonialId, approvedBy);
  if (!updated) notFound("Testimonial");

  return mapTestimonialForAdminDetail(updated);
}

export async function toggleFeatured(testimonialId, isFeatured) {
  if (!testimonialId) validationError("testimonialId");

  const updated = await testimonialRepo.toggleFeatured(testimonialId, isFeatured);
  if (!updated) notFound("Testimonial");

  return mapTestimonialForAdminDetail(updated);
}

export async function updateTestimonial(testimonialId, data) {
  if (!testimonialId) validationError("testimonialId");
  if (!data || Object.keys(data).length === 0) validationError("data");

  const updated = await testimonialRepo.updateTestimonialById(testimonialId, data);
  if (!updated) notFound("Testimonial");

  return mapTestimonialForAdminDetail(updated);
}

export async function deleteTestimonial(testimonialId) {
  if (!testimonialId) validationError("testimonialId");

  const deleted = await testimonialRepo.deleteTestimonialById(testimonialId);
  if (!deleted) notFound("Testimonial");

  return { deleted: true, id: testimonialId };
}

export async function getPublicTestimonials({ limit = 10, page = 1, productId } = {}) {
  const result = await testimonialRepo.findTestimonials({
    isApproved: true,
    isActive: true,
    productId,
    limit,
    page,
    sort: { isFeatured: -1, createdAt: -1 },
  });

  return {
    data: mapTestimonialsForPublic(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getFeaturedTestimonials(limit = 6) {
  const testimonials = await testimonialRepo.findFeaturedTestimonials(limit);
  return mapTestimonialsForPublic(testimonials);
}

export async function getAverageRating(productId = null) {
  const filter = {};
  if (productId) filter["product.itemId"] = productId;
  return testimonialRepo.getAverageRating(filter);
}

export async function getTestimonialStats() {
  const [total, approved, pending] = await Promise.all([
    testimonialRepo.countTestimonials(),
    testimonialRepo.countTestimonials({ isApproved: true }),
    testimonialRepo.countTestimonials({ isApproved: false }),
  ]);

  return { total, approved, pending };
}

export default {
  listTestimonials,
  getTestimonialById,
  submitTestimonial,
  approveTestimonial,
  toggleFeatured,
  updateTestimonial,
  deleteTestimonial,
  getPublicTestimonials,
  getFeaturedTestimonials,
  getAverageRating,
  getTestimonialStats,
};