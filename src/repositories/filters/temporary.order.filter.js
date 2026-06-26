export function buildTemporaryOrderFilter({
  buyerId,
  buyerModel,
  email,
  telephoneHash,
  addressHash,
  verificationToken,
  partnerId,
  source,
  ids,
} = {}) {
  const filter = {};

  if (buyerId) filter.buyerId = buyerId;
  if (buyerModel) filter.buyerModel = buyerModel;
  if (email) filter["buyerInfo.email"] = email.toLowerCase().trim();
  if (telephoneHash) filter["telephone.hash"] = telephoneHash;
  if (addressHash) filter["address.hash"] = addressHash;
  if (verificationToken) filter.verificationToken = verificationToken;
  if (partnerId) filter["partner.partnerId"] = partnerId;
  if (source) filter["partner.source"] = source;

  if (ids && Array.isArray(ids) && ids.length > 0) {
    filter._id = { $in: ids };
  }

  return filter;
}