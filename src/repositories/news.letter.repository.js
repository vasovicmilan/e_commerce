import Newsletter from "../models/news.letter.model.js";
import { buildNewsletterFilter } from "./filters/news.letter.filter.js";
import { resolveLimit, resolveSkip } from "../utils/pagination.util.js";

export async function findNewsletters({
  search,
  email,
  isActive,
  ids,
  limit: rawLimit,
  page: rawPage = 1,
  sort = { createdAt: -1 },
  session = null,
} = {}) {
  const limit = resolveLimit(rawLimit);
  const skip = resolveSkip(rawPage, limit);

  const filter = buildNewsletterFilter({ search, email, isActive, ids });

  let query = Newsletter.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  if (session) query = query.session(session);

  const countQuery = session
    ? Newsletter.countDocuments(filter).session(session)
    : Newsletter.countDocuments(filter);

  const [data, total] = await Promise.all([query, countQuery]);

  return {
    data,
    total,
    page: parseInt(rawPage, 10) || 1,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function findAllNewsletters({
  search,
  email,
  isActive,
  ids,
  sort = { createdAt: -1 },
  session = null,
} = {}) {
  const filter = buildNewsletterFilter({ search, email, isActive, ids });

  let query = Newsletter.find(filter).sort(sort).lean();
  if (session) query = query.session(session);

  return query;
}

export async function findNewsletterById(id, session = null) {
  let query = Newsletter.findById(id).lean();
  if (session) query = query.session(session);
  return query;
}

export async function findNewsletterByEmail(email, session = null) {
  if (!email) return null;
  let query = Newsletter.findOne({ email: email.toLowerCase().trim() }).lean();
  if (session) query = query.session(session);
  return query;
}

export async function createNewsletter(data, session = null) {
  const newsletter = new Newsletter(data);
  return newsletter.save({ session });
}

export async function updateNewsletterStatus(id, isActive, session = null) {
  const opts = { new: true };
  if (session) opts.session = session;
  return Newsletter.findByIdAndUpdate(id, { $set: { isActive } }, opts).lean();
}

export async function deleteNewsletterById(id, session = null) {
  const opts = session ? { session } : {};
  return Newsletter.findByIdAndDelete(id, opts).lean();
}

export async function countNewsletters(filter = {}) {
  return Newsletter.countDocuments(filter);
}

export async function countActiveNewsletters() {
  return Newsletter.countDocuments({ isActive: true });
}

export default {
  findNewsletters,
  findAllNewsletters,
  findNewsletterById,
  findNewsletterByEmail,
  createNewsletter,
  updateNewsletterStatus,
  deleteNewsletterById,
  countNewsletters,
  countActiveNewsletters,
};