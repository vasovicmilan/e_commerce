import mongoose from "mongoose";

export function buildUserFilter({
  search,
  email,
  role,
  status,
  provider,
  googleId,
  confirmed,
  isPartner,
  telephoneHash,
  addressHash,
  ids,
} = {}) {
  const filter = {};

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { email: regex },
      { firstName: regex },
      { lastName: regex },
    ];
  }

  if (email) {
    filter.email = email.toLowerCase().trim();
  }

  if (role) {
    if (role.match && role.match(/^[0-9a-fA-F]{24}$/)) {
      filter.role = new mongoose.Types.ObjectId(role);
    } else if (typeof role === "string") {
      filter.role = role;
    }
  }

  if (status) {
    filter.status = status;
  }

  if (provider) {
    filter.provider = provider;
  }

  if (googleId) {
    filter.googleId = googleId;
  }

  if (typeof confirmed === "boolean") {
    filter.confirmed = confirmed;
  }

  if (typeof isPartner === "boolean") {
    filter["partner.isPartner"] = isPartner;
  }

  if (telephoneHash) {
    filter["telephoneNumbers.hash"] = telephoneHash;
  }

  if (addressHash) {
    filter["addresses.hash"] = addressHash;
  }

  if (ids && Array.isArray(ids) && ids.length > 0) {
    filter._id = { $in: ids };
  }

  return filter;
}