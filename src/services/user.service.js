import mongoose from "mongoose";
import eventEmitter from "../events/event.emitter.js";
import * as userRepo from "../repositories/user.repository.js";
import * as userMapper from "../mappers/user.mapper.js";
import * as roleService from "./role.service.js";
import { hashPassword, generateRandomToken, sha256 } from "./crypto.service.js";
import * as itemService from "./item.service.js";
import { encryptTelephone, encryptAddress } from "../utils/encryption.util.js";
import {
  validationError,
  notFound,
  conflict,
  unauthorized,
  forbidden,
  badRequest,
} from "../utils/error.util.js";

function validateRegistrationData(data) {
  if (!data) validationError("data");
  if (!data.email) validationError("email");
  if (!data.password) validationError("password");
  if (!data.firstName) validationError("firstName");
  if (!data.lastName) validationError("lastName");

  if (data.password !== (data.passwordConfirm || data.confirmedPassword)) {
    badRequest("Lozinke se ne poklapaju");
  }
}

export async function listUsers({
  search,
  role,
  status,
  provider,
  confirmed,
  isPartner,
  limit = 10,
  page = 1,
  excludeUserId = null,
} = {}) {
  const result = await userRepo.findUsers({
    search,
    role,
    status,
    provider,
    confirmed,
    isPartner,
    limit,
    page,
    sort: { createdAt: -1 },
    populateFields: ["role"],
    excludeUserId
  });

  return {
    data: userMapper.mapUsersForAdminList(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getUserById(userId) {
  if (!userId) validationError("userId");

  const user = await userRepo.findUserById(userId, ["role"]);
  if (!user) notFound("Korisnik");

  return userMapper.mapUserForAdminDetail(user);
}

// DODATO: za sirove podatke (bez mappera)
export async function getUserRawById(userId) {
  if (!userId) validationError("userId");
  const user = await userRepo.findUserById(userId);
  if (!user) notFound("Korisnik");
  return user;
}

export async function getUserForEdit(userId, currentUserId) {
  if (!userId) validationError("userId");

  if (userId === currentUserId) {
    forbidden("Administrator ne može menjati samog sebe");
  }

  const user = await userRepo.findUserById(userId, ["role"]);
  if (!user) notFound("Korisnik");

  return userMapper.mapUserForEdit(user);
}

export async function updateUser(userId, data, currentUserId) {
  if (!userId) validationError("userId");
  if (!data || Object.keys(data).length === 0) validationError("data");

  if (userId === currentUserId) {
    forbidden("Ne možete menjati sopstvene podatke ovde");
  }

  const updateData = { ...data };

  if (data.telephoneNumbers?.length > 0) {
    updateData.telephoneNumbers = data.telephoneNumbers.map(encryptTelephone);
  }

  if (data.addresses?.length > 0) {
    updateData.addresses = data.addresses.map(encryptAddress);
  }

  const updated = await userRepo.updateUserById(userId, updateData);
  if (!updated) notFound("Korisnik");

  return userMapper.mapUserForAdminDetail(updated);
}

export async function updateUserStatus(userId, status, currentUserId) {
  if (!userId) validationError("userId");
  if (!status) validationError("status");

  if (userId === currentUserId) {
    forbidden("Ne možete menjati sopstveni status");
  }

  const updated = await userRepo.updateUserStatus(userId, status);
  if (!updated) notFound("Korisnik");

  return userMapper.mapUserForEdit(updated);
}

export async function updateUserRole(userId, roleId, currentUserId) {
  if (!userId) validationError("userId");
  if (!roleId) validationError("roleId");

  if (userId === currentUserId) {
    forbidden("Ne možete menjati sopstvenu rolu");
  }

  const role = await roleService.getRoleById(roleId);
  if (!role) notFound("Rola");

  const updated = await userRepo.updateUserRole(userId, roleId);
  if (!updated) notFound("Korisnik");

  return userMapper.mapUserForEdit(updated);
}

export async function deleteUser(userId, currentUserId) {
  if (!userId) validationError("userId");

  if (userId === currentUserId) {
    forbidden("Ne možete obrisati sopstveni nalog");
  }

  const deleted = await userRepo.deleteUserById(userId);
  if (!deleted) notFound("Korisnik");

  return { deleted: true, id: userId };
}

export async function registerUser(data) {
  validateRegistrationData(data);

  const email = data.email.toLowerCase().trim();

  const existingUser = await userRepo.findUserByEmail(email);
  if (existingUser) conflict("Korisnik sa ovim email-om već postoji");

  const hashedPassword = await hashPassword(data.password);
  const confirmToken = generateRandomToken(32);
  const confirmTokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Proveri da li je ovo prvi korisnik u bazi
  const userCount = await userRepo.countUsers();
  const isFirstUser = userCount === 0;

  // Ako je prvi korisnik - dodeli admin rolu
  let role;
  if (isFirstUser) {
    role = await roleService.findRoleByName("Administrator");
    if (!role) {
      role = await roleService.createAdminRole();
    }
  } else {
    role = await roleService.findDefaultRole();
    if (!role) {
      role = await roleService.createRole({
        name: "Customer",
        description: "Običan korisnik - kupac",
        permissions: ["view_dashboard", "view_items", "view_orders", "view_customers"],
        isDefault: true,
        priority: 0,
      });
    }
  }

  const user = await userRepo.createUser({
    email,
    password: hashedPassword,
    firstName: data.firstName,
    lastName: data.lastName,
    telephoneNumbers: [],
    addresses: [],
    role: role._id,
    status: isFirstUser ? "active" : "pending",
    provider: "local",
    confirmed: isFirstUser,
    acceptance: true,
    confirmToken: isFirstUser ? null : confirmToken,
    confirmTokenExpiration: isFirstUser ? null : confirmTokenExpiration,
  });

  const userObject = user.toObject ? user.toObject() : user;

  // Samo ako nije prvi korisnik - šalji email
  if (!isFirstUser) {
    eventEmitter.emit("user:registered", {
      email: userObject.email,
      firstName: userObject.firstName,
      lastName: userObject.lastName,
      userId: userObject._id,
      confirmToken: userObject.confirmToken,
      provider: "local",
      isFirstUser,
    });
  }

  return {
    id: userObject._id.toString(),
    email: userObject.email,
    firstName: userObject.firstName,
    confirmToken: userObject.confirmToken,
    isFirstUser,
    roleId: role._id.toString(),
    roleName: role.name,
  };
}

export async function findUserForLogin(email) {
  if (!email) return null;
  return userRepo.findUserByEmailWithPassword(email.toLowerCase().trim());
}

export async function updateLastLogin(userId) {
  if (!userId) return null;
  return userRepo.updateLastLogin(userId);
}

export async function findOrCreateGoogleUser(googleData) {
  if (!googleData?.email) validationError("email");
  if (!googleData?.googleId) validationError("googleId");

  const email = googleData.email.toLowerCase().trim();

  let user = await userRepo.findUserByGoogleId(googleData.googleId);

  if (user) {
    await userRepo.updateLastLogin(user._id);
    // Populiraj rolu za roleName
    const populatedUser = await userRepo.findUserById(user._id, ["role"]);
    return {
      ...user,
      roleName: populatedUser?.role?.name || "Customer",
      isPartner: user.partner?.isPartner || false,
    };
  }

  user = await userRepo.findUserByEmail(email);

  if (user) {
    const updated = await userRepo.updateUserById(user._id, {
      googleId: googleData.googleId,
      provider: "google",
      avatar: googleData.avatar || user.avatar,
      status: user.status === "pending" ? "active" : user.status,
      confirmed: true,
    });

    const populatedUser = await userRepo.findUserById(updated._id, ["role"]);
    return {
      ...updated,
      roleName: populatedUser?.role?.name || "Customer",
      isPartner: updated.partner?.isPartner || false,
    };
  }

  // Proveri da li je ovo prvi korisnik u bazi
  const userCount = await userRepo.countUsers();
  const isFirstUser = userCount === 0;

  // Ako je prvi korisnik - dodeli admin rolu
  let role;
  if (isFirstUser) {
    role = await roleService.findRoleByName("Administrator");
    if (!role) {
      role = await roleService.createAdminRole();
    }
  } else {
    role = await roleService.findDefaultRole();
    if (!role) {
      role = await roleService.createRole({
        name: "Customer",
        description: "Običan korisnik - kupac",
        permissions: ["view_dashboard", "view_items", "view_orders", "view_customers"],
        isDefault: true,
        priority: 0,
      });
    }
  }

  const newUser = await userRepo.createUser({
    email,
    googleId: googleData.googleId,
    firstName: googleData.firstName || "",
    lastName: googleData.lastName || "",
    avatar: googleData.avatar || "",
    provider: "google",
    role: role._id,
    status: "active",
    confirmed: true,
    acceptance: true,
  });

  const userObject = newUser.toObject ? newUser.toObject() : newUser;

  return {
    ...userObject,
    roleName: role.name,
    isPartner: false,
  };
}

export async function findUserByEmail(email) {
  if (!email) return null;
  return userRepo.findUserByEmail(email.toLowerCase().trim());
}

export async function setPasswordResetToken(userId) {
  if (!userId) validationError("userId");

  const token = generateRandomToken(32);
  const expiration = new Date(Date.now() + 60 * 60 * 1000);

  await userRepo.setResetToken(userId, token, expiration);

  return { token, expiration };
}

export async function findUserByResetToken(token) {
  if (!token) return null;
  return userRepo.findUserByResetToken(token);
}

export async function resetPassword(token, newPassword) {
  if (!token) validationError("token");
  if (!newPassword || newPassword.length < 8) validationError("password");

  const user = await userRepo.findUserByResetToken(token);
  if (!user) badRequest("Token nije validan ili je istekao");

  const hashedPassword = await hashPassword(newPassword);

  await userRepo.updatePassword(user._id, hashedPassword);
  await userRepo.clearResetToken(user._id);

  return { success: true };
}

export async function changePassword(userId, oldPassword, newPassword) {
  if (!userId) validationError("userId");
  if (!oldPassword) validationError("oldPassword");
  if (!newPassword || newPassword.length < 8) validationError("newPassword");

  const user = await userRepo.findUserByIdWithPassword(userId);
  if (!user) notFound("Korisnik");

  const { comparePasswords } = await import("./crypto.service.js");
  const isValid = await comparePasswords(oldPassword, user.password);
  if (!isValid) unauthorized("Pogrešna lozinka");

  const hashedPassword = await hashPassword(newPassword);
  await userRepo.updatePassword(userId, hashedPassword);

  return { success: true };
}

export async function confirmAccount(token) {
  if (!token) validationError("token");

  const user = await userRepo.findUserByConfirmToken(token);
  if (!user) badRequest("Token nije validan ili je istekao");

  await userRepo.confirmUser(user._id);

  return { success: true };
}

export async function getMyProfile(userId) {
  if (!userId) validationError("userId");

  const user = await userRepo.findUserById(userId, ["orders", "role"]);
  if (!user) notFound("Korisnik");

  return userMapper.mapMyProfile(user);
}

export async function getMyShop(userId) {
  if (!userId) validationError("userId");

  const user = await userRepo.findUserById(userId);
  if (!user) notFound("Korisnik");

  if (!user.partner?.isPartner) {
    forbidden("Korisnik nema partnerski nalog");
  }

  return userMapper.mapMyShop(user);
}

export async function addTelephoneToUser(userId, plainTelephone) {
  if (!userId) validationError("userId");
  if (!plainTelephone) validationError("telephone");

  const encrypted = encryptTelephone(plainTelephone);

  const existingUser = await userRepo.findUserByTelephoneHash(encrypted.hash);
  if (existingUser && String(existingUser._id) !== String(userId)) {
    conflict("Ovaj telefon već postoji kod drugog korisnika");
  }

  return userRepo.addTelephoneIfNotExists(userId, encrypted);
}

export async function removeTelephoneFromUser(userId, telephoneId) {
  if (!userId) validationError("userId");
  if (!telephoneId) validationError("telephoneId");

  const user = await userRepo.findUserById(userId);
  if (!user) notFound("Korisnik");

  const before = user.telephoneNumbers.length;
  const updatedPhones = user.telephoneNumbers.filter(
    (t) => String(t._id) !== String(telephoneId)
  );

  if (updatedPhones.length === before) {
    notFound("Telefon");
  }

  await userRepo.updateUserById(userId, { telephoneNumbers: updatedPhones });

  return { success: true };
}

export async function addAddressToUser(userId, plainAddress) {
  if (!userId) validationError("userId");
  if (!plainAddress) validationError("address");

  if (!plainAddress.city || !plainAddress.street || !plainAddress.number || !plainAddress.postalCode) {
    validationError("address");
  }

  const encrypted = encryptAddress(plainAddress);

  const existingUser = await userRepo.findUserByAddressHash(encrypted.hash);
  if (existingUser && String(existingUser._id) !== String(userId)) {
    conflict("Ova adresa već postoji kod drugog korisnika");
  }

  return userRepo.addAddressIfNotExists(userId, encrypted);
}

export async function removeAddressFromUser(userId, addressId) {
  if (!userId) validationError("userId");
  if (!addressId) validationError("addressId");

  const user = await userRepo.findUserById(userId);
  if (!user) notFound("Korisnik");

  const before = user.addresses.length;
  const updatedAddresses = user.addresses.filter(
    (a) => String(a._id) !== String(addressId)
  );

  if (updatedAddresses.length === before) {
    notFound("Adresa");
  }

  await userRepo.updateUserById(userId, { addresses: updatedAddresses });

  return { success: true };
}

export async function ensureUserData(
  userId,
  { telephones = [], addresses = [], orderId } = {},
  { session } = {}
) {
  if (!userId) validationError("userId");

  const user = await userRepo.findUserById(userId, null, session);
  if (!user) notFound("Korisnik");

  let changed = false;

  if (telephones.length > 0) {
    const existingHashes = new Set((user.telephoneNumbers || []).map((t) => t.hash));
    for (const telephone of telephones) {
      if (!telephone || !telephone.hash) continue;
      if (!existingHashes.has(telephone.hash)) {
        user.telephoneNumbers.push(telephone);
        existingHashes.add(telephone.hash);
        changed = true;
      }
    }
  }

  if (addresses.length > 0) {
    const existingHashes = new Set((user.addresses || []).map((a) => a.hash));
    for (const address of addresses) {
      if (!address || !address.hash) continue;
      if (!existingHashes.has(address.hash)) {
        user.addresses.push(address);
        existingHashes.add(address.hash);
        changed = true;
      }
    }
  }

  if (orderId) {
    const alreadyLinked = (user.orders || []).some((id) => String(id) === String(orderId));
    if (!alreadyLinked) {
      user.orders.push(orderId);
      changed = true;
    }
  }

  if (changed) {
    const updateData = {};
    if (telephones.length > 0) updateData.telephoneNumbers = user.telephoneNumbers;
    if (addresses.length > 0) updateData.addresses = user.addresses;
    if (orderId) updateData.orders = user.orders;
    await userRepo.updateUserById(userId, updateData, session);
  }

  return { updated: changed };
}

export async function migrateCustomerToUser({
  customer,
  orderId = null,
  autoCreateAccount = false,
  session: existingSession = null,
}) {
  const ownsSession = !existingSession;
  const session = existingSession || (await mongoose.startSession());
 
  try {
    if (ownsSession) session.startTransaction();
 
    const email = customer.email.toLowerCase().trim();
 
    // ── Check if a User with this email already exists ──────────────────────
    let existingUser = await userRepo.findUserByEmail(email, null, session);
 
    if (existingUser) {
      // Merge encrypted phones/addresses into the existing User and add orderId
      await ensureUserData(
        existingUser._id,
        {
          telephones: customer.telephoneNumbers || [],
          addresses:  customer.addresses        || [],
          orderId,
        },
        { session }
      );
 
      if (ownsSession) {
        await session.commitTransaction();
        // Emit only when we own the session; caller emits otherwise
        eventEmitter.emit("user:migrated", {
          email:     existingUser.email,
          firstName: existingUser.firstName,
          userId:    existingUser._id.toString(),
          migrated:  false,
          extended:  true,
        });
      }
 
      return {
        userId:         existingUser._id.toString(),
        email:          existingUser.email,
        firstName:      existingUser.firstName,
        migrated:       false,
        extended:       true,
        accountCreated: false,
        confirmToken:   null,
        resetToken:     null,
      };
    }
 
    // ── No existing User — create one if autoCreateAccount is true ──────────
    if (!autoCreateAccount) {
      if (ownsSession) await session.commitTransaction();
      return {
        userId:         null,
        migrated:       false,
        extended:       false,
        accountCreated: false,
        confirmToken:   null,
        resetToken:     null,
      };
    }
 
    // Merge orderId into the customer's existing orders array
    const orders = [...(customer.orders || [])];
    if (orderId && !orders.some((id) => String(id) === String(orderId))) {
      orders.push(orderId);
    }
 
    // FIX M2: use a random unguessable password (not the public default)
    // The user must use the reset-token link to set their own password.
    const hashedPassword = await hashPassword(generateRandomToken(24));
    const confirmToken   = generateRandomToken(32);
    const resetToken     = generateRandomToken(32);
    const defaultRole    = await roleService.findDefaultRole();
 
    const newUser = await userRepo.createUser(
      {
        email,
        password:         hashedPassword,
        firstName:        customer.firstName,
        lastName:         customer.lastName,
        telephoneNumbers: customer.telephoneNumbers || [], // already encrypted
        addresses:        customer.addresses        || [], // already encrypted
        orders,
        role:             defaultRole._id,
        status:           "pending",
        confirmed:        false,
        acceptance:       customer.acceptance ?? false,
        confirmToken,
        confirmTokenExpiration: new Date(Date.now() + 24 * 60 * 60 * 1000),
        resetToken,
        resetTokenExpiration:   new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      session
    );
 
    if (ownsSession) {
      await session.commitTransaction();
      // Emit only when we own the session; caller emits otherwise
      eventEmitter.emit("user:migrated", {
        email:     newUser.email,
        firstName: newUser.firstName,
        userId:    newUser._id.toString(),
        confirmToken,
        resetToken,
        migrated:       true,
        accountCreated: true,
      });
    }
 
    // ── Return full payload — caller decides whether to emit ────────────────
    return {
      userId:         newUser._id.toString(),
      email:          newUser.email,
      firstName:      newUser.firstName,
      migrated:       true,
      extended:       false,
      accountCreated: true,
      confirmToken,   // caller uses this to emit when ownsSession = false
      resetToken,
    };
  } catch (error) {
    if (ownsSession) await session.abortTransaction();
    logError("migrateCustomerToUser failed", error);
    throw error;
  } finally {
    if (ownsSession) session.endSession();
  }
}

export async function addOrderToUser(userId, orderId, { session } = {}) {
  if (!userId || !orderId) return null;
  return userRepo.addOrderToUser(userId, orderId, session);
}

export async function getCart(userId) {
  if (!userId) validationError("userId");
  const user = await userRepo.findUserById(userId);
  if (!user) notFound("Korisnik");
  return { items: user.cart || [], empty: !user.cart || user.cart.length === 0 };
}

export async function addItemToCart(userId, cartItem, { session } = {}) {
  if (!userId) validationError("userId");
  if (!cartItem) validationError("cartItem");

  const updatedUser = await userRepo.findUserById(userId, null, session);
  if (!updatedUser) notFound("Korisnik");

  const cart = updatedUser.cart || [];
  const existingIndex = cart.findIndex(
    (i) => String(i.itemId) === String(cartItem.itemId) && String(i.variationId) === String(cartItem.variationId)
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += cartItem.quantity || 1;
  } else {
    cart.push({ ...cartItem, quantity: cartItem.quantity || 1 });
  }

  await userRepo.setCart(userId, cart, session);
  return cart;
}

export async function removeItemFromCart(userId, { itemId, variationId, quantity = 1 }, { session } = {}) {
  if (!userId) validationError("userId");
  if (!itemId) validationError("itemId");

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) validationError("quantity");

  const user = await userRepo.findUserById(userId, null, session);
  if (!user) notFound("Korisnik");

  const cart = user.cart || [];
  const idx = cart.findIndex(
    (i) => String(i.itemId) === String(itemId) && String(i.variationId) === String(variationId)
  );

  if (idx === -1) return cart;

  if (cart[idx].quantity <= qty) {
    cart.splice(idx, 1);
  } else {
    cart[idx].quantity -= qty;
  }

  await userRepo.setCart(userId, cart, session);
  return cart;
}

export async function clearCart(userId, { session } = {}) {
  if (!userId) validationError("userId");
  await userRepo.clearCart(userId, session);
  return { items: [], empty: true };
}

export async function mergeGuestCart(userId, guestCart = []) {
  if (!userId) validationError("userId");
  if (!Array.isArray(guestCart) || guestCart.length === 0) {
    return getCart(userId);
  }
  for (const item of guestCart) {
    await addItemToCart(userId, item);
  }
  return getCart(userId);
}

export async function deactivateAccount(userId, password) {
  if (!userId) validationError("userId");
  if (!password) validationError("password");

  const user = await userRepo.findUserByIdWithPassword(userId);
  if (!user) notFound("Korisnik");

  const { comparePasswords } = await import("./crypto.service.js");
  const isValid = await comparePasswords(password, user.password);
  if (!isValid) unauthorized("Pogrešna lozinka");

  await userRepo.updateUserStatus(userId, "inactive");
  await userRepo.updateUserById(userId, { lastLogin: null });

  return { success: true, message: "Nalog je deaktiviran" };
}

export async function verifyUserByAdmin(userId) {
  if (!userId) validationError("userId");

  const user = await userRepo.findUserById(userId);
  if (!user) notFound("Korisnik");

  if (user.confirmed) {
    return { verified: false, message: "Nalog je već verifikovan" };
  }

  await userRepo.confirmUser(userId);

  return { verified: true, message: "Nalog je uspešno verifikovan" };
}

export async function getUserStats() {
  const [total, byStatus, byRole, byProvider, newThisMonth, activeThisWeek] = await Promise.all([
    userRepo.countUsers(),
    userRepo.countUsersByStatus(),
    userRepo.countUsersByRole(),
    userRepo.countUsersByProvider(),
    userRepo.countNewUsers({ days: 30 }),
    userRepo.countActiveUsers({ days: 7 }),
  ]);

  return { total, byStatus, byRole, byProvider, newThisMonth, activeThisWeek };
}

export async function getPartners({ limit = 100, page = 1 } = {}) {
  const result = await userRepo.findUsers({
    isPartner: true,
    status: 'active',
    limit,
    page,
    sort: { firstName: 1, lastName: 1 },
    populateFields: [],
  });

  return result.data.map(user => ({
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
  }));
}

export async function updateUserPartner(userId, isPartner, currentUserId) {
  if (!userId) validationError("userId");
  if (typeof isPartner !== 'boolean') validationError("isPartner mora biti boolean");

  if (userId === currentUserId) {
    forbidden("Ne možete menjati sopstveno partnerstvo");
  }

  const user = await userRepo.findUserById(userId);
  if (!user) notFound("Korisnik");

  const updated = await userRepo.updateUserById(userId, {
    "partner.isPartner": isPartner,
  });

  if (!updated) notFound("Korisnik");

  return {
    id: updated._id.toString(),
    isPartner: updated.partner?.isPartner || false,
  };
}

export async function updatePartnerData(userId, data, currentUserId) {
  if (!userId) validationError("userId");
  if (!data || Object.keys(data).length === 0) validationError("data");

  if (userId === currentUserId) {
    forbidden("Ne možete menjati sopstveno partnerstvo");
  }

  const user = await userRepo.findUserById(userId);
  if (!user) notFound("Korisnik");

  const allowedFields = [
    "partner.shop.status",
    "partner.shop.logo",
    "partner.shop.colors",
    "partner.shop.fonts",
    "partner.rank.level",
    "partner.rank.points",
    "partner.rank.discount",
    "partner.rank.maxOffers",
    "partner.slug",
  ];

  const updateData = {};
  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      updateData[key] = data[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    badRequest("Nema podataka za ažuriranje");
  }

  const updated = await userRepo.updateUserById(userId, updateData);
  if (!updated) notFound("Korisnik");

  return {
    id: updated._id.toString(),
    partner: updated.partner || null,
  };
}

// =============== SLUG FUNKCIJE ===============
export async function checkSlugAvailability(slug, excludeUserId = null) {
  if (!slug) return { available: false, message: "Slug je obavezan" };

  const sanitized = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
  if (!sanitized) {
    return { available: false, message: "Slug sadrži nedozvoljene karaktere" };
  }

  const existing = await userRepo.findUserByPartnerSlug(sanitized);
  if (existing && (!excludeUserId || existing._id.toString() !== excludeUserId)) {
    return { available: false, message: "Ovaj slug je već zauzet" };
  }

  return { available: true, slug: sanitized };
}

export async function updatePartnerSlug(userId, newSlug, currentUserId) {
  if (!userId) validationError("userId");
  if (!newSlug) validationError("slug");

  if (userId === currentUserId) {
    forbidden("Ne možete menjati sopstveno partnerstvo");
  }

  const availability = await checkSlugAvailability(newSlug, userId);
  if (!availability.available) {
    conflict(availability.message);
  }

  const updated = await userRepo.updateUserById(userId, {
    'partner.slug': availability.slug,
  });

  if (!updated) notFound("Korisnik");

  return {
    id: updated._id.toString(),
    slug: updated.partner?.slug || null,
  };
}

export async function findUserByPartnerSlug(slug, populateFields = null) {
  if (!slug) return null;
  return userRepo.findUserByPartnerSlug(slug, populateFields);
}

// ============================================================
//  WISHLIST – wrapperi za itemService
// ============================================================

export async function getUserWishlist(userId, options = {}) {
  if (!userId) validationError("userId");
  return itemService.getUserWishlist(userId, options);
}

export async function addToWishlist(userId, itemId) {
  if (!userId) validationError("userId");
  if (!itemId) validationError("itemId");
  return itemService.addToWishlist(itemId, userId);
}

export async function removeFromWishlist(userId, itemId) {
  if (!userId) validationError("userId");
  if (!itemId) validationError("itemId");
  return itemService.removeFromWishlist(itemId, userId);
}

export async function isInWishlist(userId, itemId) {
  if (!userId) return false;
  if (!itemId) return false;
  return itemService.isInWishlist(itemId, userId);
}

export default {
  listUsers, getUserById, getUserRawById, getUserForEdit,
  updateUser, updateUserStatus, updateUserRole, deleteUser,
  registerUser, findUserForLogin, updateLastLogin, findOrCreateGoogleUser, findUserByEmail,
  setPasswordResetToken, findUserByResetToken, resetPassword, changePassword,
  confirmAccount,
  getMyProfile, getMyShop,
  addTelephoneToUser, removeTelephoneFromUser, addAddressToUser, removeAddressFromUser,
  ensureUserData, addOrderToUser,
  migrateCustomerToUser,
  getCart, addItemToCart, removeItemFromCart, clearCart, mergeGuestCart,
  deactivateAccount, verifyUserByAdmin,
  getPartners,
  getUserStats, updateUserPartner, updatePartnerData,
  checkSlugAvailability, updatePartnerSlug,
  findUserByPartnerSlug,
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
};