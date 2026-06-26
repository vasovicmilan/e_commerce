export function resolveLimit(rawLimit) {
  const limit = parseInt(rawLimit, 10);
  if (isNaN(limit) || limit < 1) return 10;
  return Math.min(limit, 100);
}

export function resolveSkip(rawPage, limit) {
  const page = parseInt(rawPage, 10);
  if (isNaN(page) || page < 1) return 0;
  return (page - 1) * limit;
}

export function createPaginationMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}