export function buildNewsletterFilter({
  search,
  email,
  isActive,
  ids,
} = {}) {
  const filter = {};

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { email: regex },
      { firstName: regex },
    ];
  }

  if (email) {
    filter.email = email.toLowerCase().trim();
  }

  if (typeof isActive === "boolean") {
    filter.isActive = isActive;
  }

  if (ids && Array.isArray(ids) && ids.length > 0) {
    filter._id = { $in: ids };
  }

  return filter;
}