export function buildOrderFilter({
  search,
  buyerId,
  buyerModel,
  email,
  status,
  statuses,
  city,
  telephoneHash,
  addressHash,
  dateFrom,
  dateTo,
  minTotal,
  maxTotal,
  partnerId,
  source,
  ids,
} = {}) {
  const filter = {};

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { "buyerInfo.firstName": regex },
      { "buyerInfo.lastName": regex },
      { "buyerInfo.email": regex },
      { "items.title": regex },
    ];
  }

  if (buyerId) filter.buyerId = buyerId;
  if (buyerModel) filter.buyerModel = buyerModel;
  if (email) filter["buyerInfo.email"] = email.toLowerCase().trim();
  if (status) filter.status = status;

  if (statuses && Array.isArray(statuses) && statuses.length > 0) {
    filter.status = { $in: statuses };
  }

  if (city) filter["address.city"] = city;
  if (telephoneHash) filter["telephone.hash"] = telephoneHash;
  if (addressHash) filter["address.hash"] = addressHash;

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  if (minTotal !== undefined || maxTotal !== undefined) {
    filter.totalPrice = {};
    if (minTotal !== undefined) filter.totalPrice.$gte = minTotal;
    if (maxTotal !== undefined) filter.totalPrice.$lte = maxTotal;
  }

  if (partnerId) filter["partner.partnerId"] = partnerId;
  if (source) filter["partner.source"] = source;

  if (ids && Array.isArray(ids) && ids.length > 0) {
    filter._id = { $in: ids };
  }

  return filter;
}