import Contact from "../models/contact.model.js";
import { buildContactFilter } from "./filters/contact.filter.js";
import { resolveLimit, resolveSkip } from "../utils/pagination.util.js";

export async function findContacts({
  search,
  email,
  status,
  statuses,
  ids,
  limit: rawLimit,
  page: rawPage = 1,
  sort = { createdAt: -1 },
  session = null,
} = {}) {
  const limit = resolveLimit(rawLimit);
  const skip = resolveSkip(rawPage, limit);

  const filter = buildContactFilter({
    search,
    email,
    status,
    statuses,
    ids,
  });

  let query = Contact.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  if (session) {
    query = query.session(session);
  }

  const countQuery = session
    ? Contact.countDocuments(filter).session(session)
    : Contact.countDocuments(filter);

  const [data, total] = await Promise.all([query, countQuery]);

  return {
    data,
    total,
    page: parseInt(rawPage, 10) || 1,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function findAllContacts({
  search,
  email,
  status,
  statuses,
  ids,
  sort = { createdAt: -1 },
  session = null,
} = {}) {
  const filter = buildContactFilter({
    search,
    email,
    status,
    statuses,
    ids,
  });

  let query = Contact.find(filter)
    .sort(sort)
    .lean();

  if (session) {
    query = query.session(session);
  }

  return query;
}

export async function findContactById(id, session = null) {
  let query = Contact.findById(id).lean();
  if (session) query = query.session(session);
  return query;
}

export async function createContact(data, session = null) {
  const contact = new Contact(data);
  return contact.save({ session });
}

export async function updateContactStatus(id, status, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;
  return Contact.findByIdAndUpdate(id, { $set: { status } }, opts).lean();
}

export async function countContacts(filter = {}) {
  return Contact.countDocuments(filter);
}

export async function countContactsByStatus() {
  const result = await Contact.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const counts = {};
  for (const row of result) {
    counts[row._id] = row.count;
  }
  return counts;
}

export async function countNewContacts() {
  return Contact.countDocuments({ status: "new" });
}

export default {
  findContacts,
  findAllContacts,
  findContactById,
  createContact,
  updateContactStatus,
  countContacts,
  countContactsByStatus,
  countNewContacts,
};