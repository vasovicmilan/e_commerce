export function buildPostFilter({
  search,
  useTextIndex = true,
  slug,
  status,
  statuses,
  authorId,
  categoryIds,
  tagIds,
  isFeatured,
  ids,
} = {}) {
  const filter = {};

  if (search && search.trim()) {
    if (useTextIndex) {
      filter.$text = { $search: search.trim() };
    } else {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { title: regex },
        { description: regex },
        { shortDescription: regex },
        { keyWords: regex },
      ];
    }
  }

  if (slug) {
    filter.slug = slug.toLowerCase().trim();
  }

  if (status) {
    filter.status = status;
  }

  if (statuses && Array.isArray(statuses) && statuses.length > 0) {
    filter.status = { $in: statuses };
  }

  if (authorId) {
    filter.author = authorId;
  }

  if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
    filter.categories = { $in: categoryIds };
  }

  if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
    filter.tags = { $in: tagIds };
  }

  if (isFeatured === true) {
    filter.status = "featured";
  }

  if (ids && Array.isArray(ids) && ids.length > 0) {
    filter._id = { $in: ids };
  }

  return filter;
}