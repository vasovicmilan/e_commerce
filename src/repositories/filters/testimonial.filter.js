export function buildTestimonialFilter({
  search,
  rating,
  minRating,
  isApproved,
  isFeatured,
  isActive,
  productId,
  userId,
  ids,
} = {}) {
  const filter = {};

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { displayName: regex },
      { email: regex },
      { title: regex },
      { comment: regex },
    ];
  }

  if (rating) {
    filter.rating = rating;
  }

  if (minRating !== undefined) {
    filter.rating = { $gte: minRating };
  }

  if (typeof isApproved === "boolean") {
    filter.isApproved = isApproved;
  }

  if (typeof isFeatured === "boolean") {
    filter.isFeatured = isFeatured;
  }

  if (typeof isActive === "boolean") {
    filter.isActive = isActive;
  }

  if (productId) {
    filter["product.itemId"] = productId;
  }

  if (userId) {
    filter.user = userId;
  }

  if (ids && Array.isArray(ids) && ids.length > 0) {
    filter._id = { $in: ids };
  }

  return filter;
}