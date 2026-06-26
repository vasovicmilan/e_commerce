export function buildCategoryFilter({
  search,
  domain,
  parent,
  isIndexable,
  isActive,
  ids,
} = {}) {
  const filter = {};

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { name: regex },
      { shortDescription: regex },
      { longDescription: regex },
    ];
  }

  if (domain) {
    filter.domain = domain;
  }

  if (parent !== undefined) {
    filter.parent = parent === "root" ? null : parent;
  }

  if (typeof isIndexable === "boolean") {
    filter.isIndexable = isIndexable;
  }

  if (typeof isActive === "boolean") {
    filter["meta.isActive"] = isActive;
  }

  if (ids && Array.isArray(ids) && ids.length > 0) {
    filter._id = { $in: ids };
  }

  return filter;
}