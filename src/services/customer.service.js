import mongoose from "mongoose";
import * as customerRepo from "../repositories/customer.repository.js";
import * as userService from "./user.service.js";
import {
  mapCustomersForAdminList,
  mapCustomerForAdminDetail,
  mapCustomerForMigration,
} from "../mappers/customer.mapper.js";
import { sha256 } from "./crypto.service.js";
import { encryptTelephone, encryptAddress } from "../utils/encryption.util.js";
import { validationError, notFound, conflict } from "../utils/error.util.js";

function validateCustomerPayload(data) {
  if (!data) validationError("data");
  if (!data.email) validationError("email");
  if (!data.firstName) validationError("firstName");
  if (!data.lastName) validationError("lastName");
}

function encryptCustomerData(data) {
  const encrypted = { ...data };

  if (data.telephoneNumbers?.length > 0) {
    encrypted.telephoneNumbers = data.telephoneNumbers.map(encryptTelephone);
  }

  if (data.addresses?.length > 0) {
    encrypted.addresses = data.addresses.map(encryptAddress);
  }

  return encrypted;
}

export async function findCustomerByEmail(email) {
  if (!email) return null;
  return customerRepo.findCustomerByEmail(email);
}

export async function findCustomerByTelephone(plainTelephone) {
  if (!plainTelephone) return null;
  const hash = sha256(plainTelephone);
  return customerRepo.findCustomerByTelephoneHash(hash);
}

export async function findCustomerByAddress(plainAddress) {
  if (!plainAddress) return null;
  const hash = sha256(
    `${plainAddress.street}|${plainAddress.number}|${plainAddress.city}|${plainAddress.postalCode}`
  );
  return customerRepo.findCustomerByAddressHash(hash);
}

export async function resolveCustomerForOrder(
  { firstName, lastName, email, acceptance = false },
  { session = null } = {}
) {
  if (!email) validationError("email");
 
  // Normalise
  const normalizedEmail = email.toLowerCase().trim();
 
  // Try to find an existing Customer with this email
  let customer = await customerRepo.findCustomerByEmail(
    normalizedEmail,
    null,
    session    // ← session forwarded (M4 fix)
  );
 
  if (customer) {
    logInfo("Existing customer found for order", { customerId: customer._id });
    return { customer, created: false };
  }
 
  // Create new Customer
  customer = await customerRepo.createCustomer(
    {
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      email:     normalizedEmail,
      acceptance,
    },
    session    // ← session forwarded (M4 fix)
  );
 
  logInfo("New customer created for order", { customerId: customer._id });
  return { customer, created: true };
}

export async function ensureCustomerData(
  customerId,
  { telephones = [], addresses = [], orderId } = {},
  { session } = {}
) {
  if (!customerId) validationError("customerId");

  const customerDoc = await customerRepo.findCustomerDocument(customerId, session);

  if (!customerDoc) notFound("Customer");

  let changed = false;

  if (telephones.length > 0) {
    const existingHashes = new Set(
      customerDoc.telephoneNumbers.map((t) => t.hash)
    );

    for (const telephone of telephones) {
      if (!telephone || !telephone.hash) continue;

      if (!existingHashes.has(telephone.hash)) {
        customerDoc.telephoneNumbers.push(telephone);
        existingHashes.add(telephone.hash);
        changed = true;
      }
    }
  }

  if (addresses.length > 0) {
    const existingHashes = new Set(
      customerDoc.addresses.map((a) => a.hash)
    );

    for (const address of addresses) {
      if (!address || !address.hash) continue;

      if (!existingHashes.has(address.hash)) {
        customerDoc.addresses.push(address);
        existingHashes.add(address.hash);
        changed = true;
      }
    }
  }

  if (orderId) {
    const alreadyLinked = customerDoc.orders.some(
      (id) => String(id) === String(orderId)
    );

    if (!alreadyLinked) {
      customerDoc.orders.push(orderId);
      changed = true;
    }
  }

  if (changed) {
    await customerDoc.save({ session });
  }

  return { updated: changed };
}

export async function addTelephoneToCustomer(customerId, plainTelephone, { session } = {}) {
  if (!customerId || !plainTelephone) return null;

  const encrypted = encryptTelephone(plainTelephone);
  return customerRepo.addTelephoneIfNotExists(customerId, encrypted, session);
}

export async function addAddressToCustomer(customerId, plainAddress, { session } = {}) {
  if (!customerId || !plainAddress) return null;

  const encrypted = encryptAddress(plainAddress);
  return customerRepo.addAddressIfNotExists(customerId, encrypted, session);
}

export async function addOrderToCustomer(customerId, orderId, { session } = {}) {
  if (!customerId || !orderId) return null;
  return customerRepo.addOrderToCustomer(customerId, orderId, session);
}

export async function listCustomers({
  search,
  city,
  hasOrders,
  limit = 10,
  page = 1,
} = {}) {
  const result = await customerRepo.findCustomers({
    search,
    city,
    hasOrders,
    limit,
    page,
    sort: { createdAt: -1 },
  });

  return {
    data: mapCustomersForAdminList(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getCustomerById(customerId) {
  if (!customerId) validationError("customerId");

  const customer = await customerRepo.findCustomerById(customerId);
  if (!customer) notFound("Customer");

  return mapCustomerForAdminDetail(customer);
}

export async function getCustomerByEmail(email) {
  if (!email) validationError("email");

  const customer = await customerRepo.findCustomerByEmail(email);
  if (!customer) notFound("Customer");

  return mapCustomerForAdminDetail(customer);
}

export async function findCustomerByIdRaw(customerId, { session } = {}) {
  if (!customerId) validationError("customerId");

  const customer = await customerRepo.findCustomerById(customerId, null, session);
  if (!customer) notFound("Customer");

  return customer;
}

export async function updateCustomer(customerId, data) {
  if (!customerId) validationError("customerId");
  if (!data || Object.keys(data).length === 0) validationError("data");

  const updateData = { ...data };

  if (data.telephoneNumbers?.length > 0) {
    updateData.telephoneNumbers = data.telephoneNumbers.map(encryptTelephone);
  }

  if (data.addresses?.length > 0) {
    updateData.addresses = data.addresses.map(encryptAddress);
  }

  const updated = await customerRepo.updateCustomerById(customerId, updateData);
  if (!updated) notFound("Customer");

  return mapCustomerForAdminDetail(updated);
}

export async function deleteCustomer(customerId, { session } = {}) {
  if (!customerId) validationError("customerId");

  const deleted = await customerRepo.deleteCustomerById(customerId, session);
  if (!deleted) notFound("Customer");

  return { deleted: true, id: customerId };
}

export async function getCustomerForMigration(customerId) {
  if (!customerId) validationError("customerId");

  const customer = await customerRepo.findCustomerById(customerId);
  if (!customer) notFound("Customer");

  return mapCustomerForMigration(customer);
}

export async function migrateCustomerToUser(email, { session: existingSession } = {}) {
  if (!email) validationError("email");

  const ownsSession = !existingSession;
  const session = existingSession || await mongoose.startSession();

  try {
    if (ownsSession) {
      session.startTransaction();
    }

    const customer = await customerRepo.findCustomerByEmail(email, null, session);

    if (!customer) {
      if (ownsSession) {
        await session.commitTransaction();
      }
      return { migrated: false, reason: "Customer not found" };
    }

    const customerData = mapCustomerForMigration(customer);

    const user = await userService.findUserByEmail(email);
    if (!user) {
      throw new Error("User not found for migration");
    }

    if (customerData.telephoneNumbers?.length > 0) {
      for (const tel of customerData.telephoneNumbers) {
        await userService.addTelephoneToUser(user._id, tel.value);
      }
    }

    if (customerData.addresses?.length > 0) {
      for (const addr of customerData.addresses) {
        await userService.addAddressToUser(user._id, addr);
      }
    }

    if (customerData.orders?.length > 0) {
      for (const orderId of customerData.orders) {
        await userService.addOrderToUser(user._id, orderId);
      }
    }

    await customerRepo.deleteCustomerById(customer._id, session);

    if (ownsSession) {
      await session.commitTransaction();
    }

    return {
      migrated: true,
      customerId: customer._id.toString(),
      userId: user._id.toString(),
      ordersMigrated: customerData.orders?.length || 0,
      telephonesMigrated: customerData.telephoneNumbers?.length || 0,
      addressesMigrated: customerData.addresses?.length || 0,
    };

  } catch (error) {
    if (ownsSession) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (ownsSession) {
      session.endSession();
    }
  }
}

export async function deleteCustomerAfterMigration(customerId, session = null) {
  return customerRepo.deleteCustomerById(customerId, session);
}

export async function getCustomerStats() {
  const [total, withOrders, newThisMonth] = await Promise.all([
    customerRepo.countCustomers(),
    customerRepo.countCustomersWithOrders(),
    customerRepo.countCustomersByDate({ days: 30 }),
  ]);

  return { total, ...withOrders, newThisMonth };
}

export async function getCustomerRawById(customerId, { session } = {}) {
  if (!customerId) validationError("customerId");
  const customer = await customerRepo.findCustomerById(customerId, null, session);
  if (!customer) notFound("Kupac");
  return customer;
}

export default {
  findCustomerByEmail,
  findCustomerByTelephone,
  findCustomerByAddress,

  resolveCustomerForOrder,
  ensureCustomerData,
  addTelephoneToCustomer,
  addAddressToCustomer,
  addOrderToCustomer,

  listCustomers,
  getCustomerById,
  getCustomerByEmail,
  findCustomerByIdRaw,

  updateCustomer,
  deleteCustomer,

  getCustomerForMigration,
  migrateCustomerToUser,
  deleteCustomerAfterMigration,

  getCustomerStats,
  getCustomerRawById,
};