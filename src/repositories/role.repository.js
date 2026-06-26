import Role from "../models/role.model.js";
import { buildRoleFilter } from "./filters/role.filter.js";
import { resolveLimit, resolveSkip } from "../utils/pagination.util.js";

export async function findRoles({
  search,
  name,
  isDefault,
  isActive,
  ids,
  limit: rawLimit,
  page: rawPage = 1,
  sort = { priority: -1, name: 1 },
  session = null,
} = {}) {
  const limit = resolveLimit(rawLimit);
  const skip = resolveSkip(rawPage, limit);

  const filter = buildRoleFilter({ search, name, isDefault, isActive, ids });

  let query = Role.find(filter).sort(sort).skip(skip).limit(limit).lean();
  if (session) query = query.session(session);

  const countQuery = session
    ? Role.countDocuments(filter).session(session)
    : Role.countDocuments(filter);

  const [data, total] = await Promise.all([query, countQuery]);

  return {
    data,
    total,
    page: parseInt(rawPage, 10) || 1,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function findAllRoles({
  search,
  name,
  isDefault,
  isActive,
  ids,
  sort = { priority: -1, name: 1 },
  session = null,
} = {}) {
  const filter = buildRoleFilter({ search, name, isDefault, isActive, ids });

  let query = Role.find(filter).sort(sort).lean();
  if (session) query = query.session(session);

  return query;
}

export async function findRoleById(id, session = null) {
  let query = Role.findById(id).lean();
  if (session) query = query.session(session);
  return query;
}

export async function findRoleByName(name, session = null) {
  let query = Role.findOne({ name }).lean();
  if (session) query = query.session(session);
  return query;
}

export async function findDefaultRole(session = null) {
  let query = Role.findOne({ isDefault: true, isActive: true })
    .sort({ priority: -1 })
    .lean();
  if (session) query = query.session(session);
  return query;
}

export async function createRole(data, session = null) {
  const role = new Role(data);
  return role.save({ session });
}

export async function updateRoleById(id, data, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;
  return Role.findByIdAndUpdate(id, { $set: data }, opts).lean();
}

export async function deleteRoleById(id, session = null) {
  const opts = session ? { session } : {};
  return Role.findByIdAndDelete(id, opts).lean();
}

export async function countRoles(filter = {}) {
  return Role.countDocuments(filter);
}

export default {
  findRoles,
  findAllRoles,
  findRoleById,
  findRoleByName,
  findDefaultRole,
  createRole,
  updateRoleById,
  deleteRoleById,
  countRoles,
};