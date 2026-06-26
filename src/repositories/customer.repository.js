import Customer from "../models/customer.model.js";
import { buildCustomerFilter } from "./filters/customer.filter.js";
import { resolveLimit, resolveSkip } from "../utils/pagination.util.js";

export async function findCustomers({
  search,
  email,
  city,
  telephoneHash,
  addressHash,
  hasOrders,
  ids,
  limit: rawLimit,
  page: rawPage = 1,
  sort = { createdAt: -1 },
  populateFields = null,
  session = null,
} = {}) {
  const limit = resolveLimit(rawLimit);
  const skip = resolveSkip(rawPage, limit);

  const filter = buildCustomerFilter({
    search,
    email,
    city,
    telephoneHash,
    addressHash,
    hasOrders,
    ids,
  });

  let query = Customer.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  if (populateFields) {
    query = query.populate(populateFields);
  }

  if (session) {
    query = query.session(session);
  }

  const countQuery = session
    ? Customer.countDocuments(filter).session(session)
    : Customer.countDocuments(filter);

  const [data, total] = await Promise.all([query, countQuery]);

  return {
    data,
    total,
    page: parseInt(rawPage, 10) || 1,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function findAllCustomers({
  search,
  email,
  city,
  ids,
  sort = { createdAt: -1 },
  populateFields = null,
  session = null,
} = {}) {
  const filter = buildCustomerFilter({ search, email, city, ids });

  let query = Customer.find(filter)
    .sort(sort)
    .lean();

  if (populateFields) {
    query = query.populate(populateFields);
  }

  if (session) {
    query = query.session(session);
  }

  return query;
}

export async function findCustomerById(id, populateFields = null, session = null) {
  let query = Customer.findById(id).lean();
  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);
  return query;
}

export async function findCustomerDocument(id, session = null) {
  let query = Customer.findById(id);
  if (session) query = query.session(session);
  return query;
}

export async function findCustomerByEmail(email, populateFields = null, session = null) {
  if (!email) return null;

  let query = Customer.findOne({
    email: email.toLowerCase().trim(),
  }).lean();

  if (populateFields) query = query.populate(populateFields);
  if (session) query = query.session(session);
  return query;
}

export async function findCustomerByTelephoneHash(hash, session = null) {
  if (!hash) return null;

  let query = Customer.findOne({
    "telephoneNumbers.hash": hash,
  }).lean();

  if (session) query = query.session(session);
  return query;
}

export async function findCustomerByAddressHash(hash, session = null) {
  if (!hash) return null;

  let query = Customer.findOne({
    "addresses.hash": hash,
  }).lean();

  if (session) query = query.session(session);
  return query;
}

export async function createCustomer(data, session = null) {
  const customer = new Customer(data);
  return customer.save({ session });
}

export async function updateCustomerById(id, data, session = null) {
  const opts = { new: true, runValidators: true };
  if (session) opts.session = session;

  return Customer.findByIdAndUpdate(id, { $set: data }, opts).lean();
}

export async function addTelephoneIfNotExists(customerId, telephone, session = null) {
  const opts = session ? { session } : {};

  return Customer.findOneAndUpdate(
    {
      _id: customerId,
      "telephoneNumbers.hash": { $ne: telephone.hash },
    },
    {
      $push: { telephoneNumbers: telephone },
    },
    { new: true, ...opts }
  ).lean();
}

export async function addAddressIfNotExists(customerId, address, session = null) {
  const opts = session ? { session } : {};

  return Customer.findOneAndUpdate(
    {
      _id: customerId,
      "addresses.hash": { $ne: address.hash },
    },
    {
      $push: { addresses: address },
    },
    { new: true, ...opts }
  ).lean();
}

export async function addOrderToCustomer(customerId, orderId, session = null) {
  const opts = session ? { session } : {};
  return Customer.findByIdAndUpdate(
    customerId,
    { $push: { orders: orderId } },
    opts
  ).lean();
}

export async function removeOrderFromCustomer(customerId, orderId, session = null) {
  const opts = session ? { session } : {};
  return Customer.findByIdAndUpdate(
    customerId,
    { $pull: { orders: orderId } },
    opts
  ).lean();
}

export async function deleteCustomerById(id, session = null) {
  const opts = session ? { session } : {};
  return Customer.findByIdAndDelete(id, opts).lean();
}

export async function countCustomers(filter = {}) {
  return Customer.countDocuments(filter);
}

export async function countCustomersWithOrders() {
  const total = await Customer.countDocuments();
  const withOrders = await Customer.countDocuments({
    "orders.0": { $exists: true },
  });

  return {
    total,
    withOrders,
    withoutOrders: total - withOrders,
  };
}

export async function countCustomersByCity() {
  const result = await Customer.aggregate([
    { $unwind: "$addresses" },
    { $group: { _id: "$addresses.city", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const counts = {};
  for (const row of result) {
    counts[row._id] = row.count;
  }
  return counts;
}

export async function countCustomersByDate({ days = 30 } = {}) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return Customer.countDocuments({
    createdAt: { $gte: since },
  });
}

export async function getCustomerRawById(customerId) {
  if (!customerId) validationError("customerId");
  const customer = await customerRepo.findCustomerById(customerId);
  if (!customer) notFound("Kupac");
  return customer;
}

export default {
  findCustomers,
  findAllCustomers,
  findCustomerById,
  findCustomerDocument,
  findCustomerByEmail,
  findCustomerByTelephoneHash,
  findCustomerByAddressHash,
  getCustomerRawById,
  createCustomer,
  updateCustomerById,
  addTelephoneIfNotExists,
  addAddressIfNotExists,
  addOrderToCustomer,
  removeOrderFromCustomer,
  deleteCustomerById,
  countCustomers,
  countCustomersByCity,
  countCustomersByDate
};