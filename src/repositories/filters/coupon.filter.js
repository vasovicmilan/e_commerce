export function buildCouponFilter({
  search,
  code,
  isActive,
  discountType,
  isValid,
  isExpired,
  ids,
} = {}) {
  const filter = {};

  if (search && search.trim()) {
    filter.code = { $regex: new RegExp(search.trim(), "i") };
  }

  if (code) {
    filter.code = code.toUpperCase().trim();
  }

  if (typeof isActive === "boolean") {
    filter.isActive = isActive;
  }

  if (discountType) {
    filter.discountType = discountType;
  }

  const now = new Date();
  if (isValid === true) {
    filter.isActive = true;
    filter.validFrom = { $lte: now };
    filter.$or = [
      { validUntil: null },
      { validUntil: { $gte: now } },
    ];
  }

  if (isExpired === true) {
    filter.validUntil = { $lt: now, $ne: null };
  }

  if (ids && Array.isArray(ids) && ids.length > 0) {
    filter._id = { $in: ids };
  }

  return filter;
}