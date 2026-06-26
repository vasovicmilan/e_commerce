import User from "../models/user.model.js";
import { buildUserFilter } from "./filters/user.filter.js";
import { resolveLimit, resolveSkip } from "../utils/pagination.util.js";

export async function findUsers({
  search,
  email,
  role,
  status,
  provider,
  confirmed,
  isPartner,
  ids,
  limit: rawLimit,
  page: rawPage = 1,
  sort = { createdAt: -1 },
  populateFields = null,
  session = null,
  excludeUserId = null,
} = {}) {
  const limit = resolveLimit(rawLimit);
  const skip = resolveSkip(rawPage, limit);

  const filter = buildUserFilter({
    search, email, role, status, provider, confirmed, isPartner, ids,
  });

  // Ako je dat excludeUserId, dodaj ga u filter
  if (excludeUserId) {
    filter._id = { $ne: excludeUserId };
  }

  let query = User.find(filter).sort(sort).skip(skip).limit(limit).lean();

  if (populateFields) {
    query = query.populate(populateFields);
  }

  if (session) {
    query = query.session(session);
  }

  const countQuery = session
    ? User.countDocuments(filter).session(session)
    : User.countDocuments(filter);

  const [data, total] = await Promise.all([query, countQuery]);

  return {
    data,
    total,
    page: parseInt(rawPage, 10) || 1,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function findAllUsers({
  search,
  email,
  role,
  status,
  provider,
  confirmed,
  isPartner,
  ids,
  sort = { createdAt: -1 },
  populateFields = null,
  session = null,
} = {}) {
  const filter = buildUserFilter({
    search, email, role, status, provider, confirmed, isPartner, ids,
  });

  let query = User.find(filter).sort(sort).lean();

  if (populateFields) {
    query = query.populate(populateFields);
  }

  if (session) {
    query = query.session(session);
  }

  return query;
}

export async function findUserById(id, populateFields = null, session = null) {
  let query = User.findById(id).lean();
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);
  return query;
}

export async function findUserByIdWithPassword(id, session = null) {
  let query = User.findById(id).select("+password").lean();
  if (session) query = query.session(session);
  return query;
}

export async function findUserByEmail(email, populateFields = null, session = null) {
  if (!email) return null;

  let query = User.findOne({ email: email.toLowerCase().trim() }).lean();

  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);
  return query;
}

export async function findUserByEmailWithPassword(email, session = null) {
  if (!email) return null;

  let query = User.findOne({ email: email.toLowerCase().trim() })
    .select("+password")
    .lean();

  if (session) query = query.session(session);
  return query;
}

export async function findUserByGoogleId(googleId, session = null) {
  if (!googleId) return null;
  let query = User.findOne({ googleId }).lean();
  if (session) query = query.session(session);
  return query;
}

export async function findUserByResetToken(token, session = null) {
  if (!token) return null;
  let query = User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: new Date() },
  }).lean();
  if (session) query = query.session(session);
  return query;
}

export async function findUserByConfirmToken(token, session = null) {
  if (!token) return null;
  let query = User.findOne({
    confirmToken: token,
    confirmTokenExpiration: { $gt: new Date() },
  }).lean();
  if (session) query = query.session(session);
  return query;
}

export async function findUserByTelephoneHash(hash, session = null) {
  if (!hash) return null;
  let query = User.findOne({ "telephoneNumbers.hash": hash }).lean();
  if (session) query = query.session(session);
  return query;
}

export async function findUserByAddressHash(hash, session = null) {
  if (!hash) return null;
  let query = User.findOne({ "addresses.hash": hash }).lean();
  if (session) query = query.session(session);
  return query;
}

export async function createUser(data, session = null) {
  const user = new User(data);
  return user.save({ session });
}

export async function updateUserById(id, data, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;
  return User.findByIdAndUpdate(id, { $set: data }, opts).lean();
}

export async function addTelephoneIfNotExists(userId, telephone, session = null) {
  const opts = session ? { session } : {};
  return User.findOneAndUpdate(
    { _id: userId, "telephoneNumbers.hash": { $ne: telephone.hash } },
    { $push: { telephoneNumbers: telephone } },
    { new: true, ...opts }
  ).lean();
}

export async function addAddressIfNotExists(userId, address, session = null) {
  const opts = session ? { session } : {};
  return User.findOneAndUpdate(
    { _id: userId, "addresses.hash": { $ne: address.hash } },
    { $push: { addresses: address } },
    { new: true, ...opts }
  ).lean();
}

export async function addOrderToUser(userId, orderId, session = null) {
  const opts = session ? { session } : {};
  return User.findByIdAndUpdate(userId, { $push: { orders: orderId } }, opts).lean();
}

export async function removeOrderFromUser(userId, orderId, session = null) {
  const opts = session ? { session } : {};
  return User.findByIdAndUpdate(userId, { $pull: { orders: orderId } }, opts).lean();
}

export async function updatePassword(userId, hashedPassword, session = null) {
  const opts = session ? { session } : {};
  return User.findByIdAndUpdate(userId, { $set: { password: hashedPassword } }, opts).lean();
}

export async function updateLastLogin(userId, session = null) {
  const opts = session ? { session } : {};
  return User.findByIdAndUpdate(userId, { $set: { lastLogin: new Date() } }, opts).lean();
}

export async function setResetToken(userId, token, expiration, session = null) {
  const opts = session ? { session } : {};
  return User.findByIdAndUpdate(
    userId,
    { $set: { resetToken: token, resetTokenExpiration: expiration } },
    opts
  ).lean();
}

export async function clearResetToken(userId, session = null) {
  const opts = session ? { session } : {};
  return User.findByIdAndUpdate(
    userId,
    { $unset: { resetToken: "", resetTokenExpiration: "" } },
    opts
  ).lean();
}

export async function setConfirmToken(userId, token, expiration, session = null) {
  const opts = session ? { session } : {};
  return User.findByIdAndUpdate(
    userId,
    { $set: { confirmToken: token, confirmTokenExpiration: expiration } },
    opts
  ).lean();
}

export async function confirmUser(userId, session = null) {
  const opts = session ? { session } : {};
  return User.findByIdAndUpdate(
    userId,
    {
      $set: { confirmed: true, status: "active" },
      $unset: { confirmToken: "", confirmTokenExpiration: "" },
    },
    opts
  ).lean();
}

export async function updateUserRole(userId, roleId, session = null) {
  const opts = session ? { session } : {};
  return User.findByIdAndUpdate(userId, { $set: { role: roleId } }, opts).lean();
}

export async function updateUserStatus(userId, status, session = null) {
  const opts = session ? { session } : {};
  return User.findByIdAndUpdate(userId, { $set: { status } }, opts).lean();
}

export async function setUserAsPartner(userId, session = null) {
  const opts = session ? { session } : {};
  return User.findByIdAndUpdate(
    userId,
    {
      $set: {
        "partner.isPartner": true,
        "partner.shop.status": true,
      },
    },
    opts
  ).lean();
}

export async function updatePartnerData(userId, data, session = null) {
  const opts = session ? { session } : {};
  const updateData = {};
  for (const [key, value] of Object.entries(data)) {
    updateData[`partner.${key}`] = value;
  }
  return User.findByIdAndUpdate(userId, { $set: updateData }, opts).lean();
}

export async function setCart(userId, cartItems, session = null) {
  const opts = session ? { session } : {};
  return User.findByIdAndUpdate(userId, { $set: { cart: cartItems } }, opts).lean();
}

export async function clearCart(userId, session = null) {
  const opts = session ? { session } : {};
  return User.findByIdAndUpdate(userId, { $set: { cart: [] } }, opts).lean();
}

export async function deleteUserById(id, session = null) {
  const opts = session ? { session } : {};
  return User.findByIdAndDelete(id, opts).lean();
}

export async function countUsers(filter = {}) {
  return User.countDocuments(filter);
}

export async function countUsersByStatus() {
  const result = await User.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts = {};
  for (const row of result) counts[row._id] = row.count;
  return counts;
}

export async function countUsersByRole() {
  const result = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } },
  ]);
  const counts = {};
  for (const row of result) counts[row._id] = row.count;
  return counts;
}

export async function countUsersByProvider() {
  const result = await User.aggregate([
    { $group: { _id: "$provider", count: { $sum: 1 } } },
  ]);
  return {
    local: result.find((r) => r._id === "local")?.count || 0,
    google: result.find((r) => r._id === "google")?.count || 0,
  };
}

export async function countNewUsers({ days = 30 } = {}) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return User.countDocuments({ createdAt: { $gte: since } });
}

export async function countActiveUsers({ days = 7 } = {}) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return User.countDocuments({ lastLogin: { $gte: since } });
}

export async function deactivateUser(userId, session = null) {
  const opts = session ? { session } : {};
  return User.findByIdAndUpdate(
    userId,
    { $set: { status: "inactive", lastLogin: null } },
    opts
  ).lean();
}

export async function findUserByPartnerSlug(slug, populateFields = null, session = null) {
  if (!slug) return null;

  let query = User.findOne({ "partner.slug": slug }).lean();

  if (populateFields) {
    query = query.populate(populateFields);
  }
  if (session) query = query.session(session);

  return query;
}

export default {
  findUsers, findAllUsers,
  findUserById, findUserByIdWithPassword,
  findUserByEmail, findUserByEmailWithPassword,
  findUserByGoogleId,
  findUserByResetToken, findUserByConfirmToken,
  findUserByTelephoneHash, findUserByAddressHash,
  createUser, updateUserById,
  addTelephoneIfNotExists, addAddressIfNotExists,
  addOrderToUser, removeOrderFromUser,
  updatePassword, updateLastLogin,
  setResetToken, clearResetToken,
  setConfirmToken, confirmUser,
  updateUserRole, updateUserStatus,
  setUserAsPartner, updatePartnerData,
  setCart, clearCart,
  deleteUserById,
  countUsers, countUsersByStatus, countUsersByRole, countUsersByProvider,
  countNewUsers, countActiveUsers,
  deactivateUser, findUserByPartnerSlug,
};