export function buildContactFilter({
  search,
  email,
  status,
  statuses,
  ids,
} = {}) {
  const filter = {};

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { firstName: regex },
      { email: regex },
      { title: regex },
    ];
  }

  if (email) {
    filter.email = email.toLowerCase().trim();
  }

  if (status) {
    filter.status = status;
  }

  if (statuses && Array.isArray(statuses) && statuses.length > 0) {
    filter.status = { $in: statuses };
  }

  if (ids && Array.isArray(ids) && ids.length > 0) {
    filter._id = { $in: ids };
  }

  return filter;
}