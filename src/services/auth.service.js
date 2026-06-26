import eventEmitter from "../events/event.emitter.js";
import * as userService from "./user.service.js";
import * as roleService from "./role.service.js";
import { hashPassword, comparePasswords, generateRandomToken, signJwt } from "./crypto.service.js";
import {
  validationError,
  notFound,
  unauthorized,
  conflict,
  badRequest,
} from "../utils/error.util.js";

export async function register(data, guestCart = []) {
  if (!data) validationError("data");
  if (!data.email) validationError("email");
  if (!data.password) validationError("password");
  if (!data.firstName) validationError("firstName");
  if (!data.lastName) validationError("lastName");

  if (data.password !== (data.passwordConfirm || data.confirmedPassword)) {
    badRequest("Lozinke se ne poklapaju");
  }

  if (data.password.length < 8) {
    badRequest("Lozinka mora imati najmanje 8 karaktera");
  }

  const result = await userService.registerUser(data);

  // Merge guest cart ako postoji
  if (guestCart && guestCart.length > 0 && result.id) {
    await userService.mergeGuestCart(result.id, guestCart);
  }

  // Izračunaj broj stavki u korpi
  const cart = await userService.getCart(result.id);
  const cartCount = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return {
    ...result,
    cartCount, // 🔥 Dodato
  };
}

export async function login(email, password, guestCart = []) {
  if (!email) validationError("email");
  if (!password) validationError("password");

  const user = await userService.findUserForLogin(email);
  if (!user) unauthorized("Pogrešan email ili lozinka");

  if (user.status === "suspended") {
    unauthorized("Vaš nalog je suspendovan");
  }

  if (!user.confirmed) {
    unauthorized("Nalog nije potvrđen. Molimo vas da potvrdite vaš email.");
  }

  const isValidPassword = await comparePasswords(password, user.password);
  if (!isValidPassword) unauthorized("Pogrešan email ili lozinka");

  await userService.updateLastLogin(user._id);

  if (user.status === "inactive") {
    await userService.updateUserStatus(user._id, "active", null);
  }

  // Merge guest cart
  if (guestCart && guestCart.length > 0) {
    await userService.mergeGuestCart(user._id, guestCart);
  }

  // Izračunaj broj stavki u korpi
  const cart = await userService.getCart(user._id);
  const cartCount = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const token = signJwt({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  const { password: _, ...userWithoutPassword } = user;

  const populatedUser = await userService.getUserById(user._id);
  
  return {
    ...userWithoutPassword,
    token,
    cartCount, // 🔥 Dodato
    roleId: user.role,
    roleName: populatedUser?.osnovno?.rola || "Customer",
    isPartner: user.partner?.isPartner || false,
  };
}

export async function googleAuth(googleData, guestCart = []) {
  if (!googleData?.email) validationError("email");
  if (!googleData?.googleId) validationError("googleId");

  const user = await userService.findOrCreateGoogleUser(googleData);

  await userService.updateLastLogin(user._id);

  const userObject = user.toObject ? user.toObject() : user;

  // Merge guest cart
  if (guestCart && guestCart.length > 0) {
    await userService.mergeGuestCart(userObject._id, guestCart);
  }

  // Izračunaj broj stavki u korpi
  const cart = await userService.getCart(userObject._id);
  const cartCount = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const token = signJwt({
    id: userObject._id,
    email: userObject.email,
    role: userObject.role,
  });

  const populatedUser = await userService.getUserById(userObject._id);

  return {
    user: {
      ...userObject,
      token,
      cartCount, // 🔥 Dodato
      roleId: userObject.role,
      roleName: populatedUser?.osnovno?.rola || userObject.roleName || "Customer",
      isPartner: userObject.partner?.isPartner || false,
    },
    isNewUser: !userObject.createdAt || userObject.createdAt > new Date(Date.now() - 5000),
  };
}

// Ostale funkcije ostaju nepromenjene...
export async function verifyAccount(token) {
  if (!token) validationError("token");
  return userService.confirmAccount(token);
}

export async function requestPasswordReset(email) {
  if (!email) validationError("email");
  const user = await userService.findUserByEmail(email);
  if (!user) {
    return { message: "Ako email postoji, poslat je link za reset lozinke" };
  }
  const result = await userService.setPasswordResetToken(user._id);
  eventEmitter.emit("user:password_reset_requested", {
    email: user.email,
    firstName: user.firstName,
    resetToken: result.token,
  });
  return { message: "Ako email postoji, poslat je link za reset lozinke" };
}

export async function resetPassword(token, newPassword, confirmPassword) {
  if (!token) validationError("token");
  if (!newPassword) validationError("newPassword");
  if (newPassword !== confirmPassword) badRequest("Lozinke se ne poklapaju");
  if (newPassword.length < 8) badRequest("Lozinka mora imati najmanje 8 karaktera");
  const result = await userService.resetPassword(token, newPassword);
  const user = await userService.findUserByResetToken(token);
  if (user) {
    eventEmitter.emit("user:password_changed", {
      email: user.email,
      firstName: user.firstName,
    });
  }
  return result;
}

export async function changePassword(userId, oldPassword, newPassword, confirmPassword) {
  if (!userId) validationError("userId");
  if (!oldPassword) validationError("oldPassword");
  if (!newPassword) validationError("newPassword");
  if (newPassword !== confirmPassword) badRequest("Lozinke se ne poklapaju");
  const result = await userService.changePassword(userId, oldPassword, newPassword);
  const user = await userService.getUserById(userId);
  if (user) {
    eventEmitter.emit("user:password_changed", {
      email: user.osnovno?.email || user.email,
      firstName: user.osnovno?.ime || user.firstName,
    });
  }
  return result;
}

export async function deactivateAccount(userId, password) {
  if (!userId) validationError("userId");
  if (!password) validationError("password");
  const result = await userService.deactivateAccount(userId, password);
  const user = await userService.getUserById(userId);
  if (user) {
    eventEmitter.emit("user:deactivated", {
      email: user.osnovno?.email || user.email,
      firstName: user.osnovno?.ime || user.firstName,
    });
  }
  return result;
}

export async function resendVerificationEmail(email) {
  if (!email) validationError("email");
  const user = await userService.findUserByEmail(email);
  if (!user) return { message: "Ako email postoji, poslat je novi verifikacioni link" };
  if (user.confirmed) badRequest("Nalog je već verifikovan");
  const result = await userService.setPasswordResetToken(user._id);
  eventEmitter.emit("user:password_reset_requested", {
    email: user.email,
    firstName: user.firstName,
    resetToken: result.token,
  });
  return { message: "Ako email postoji, poslat je novi verifikacioni link" };
}

export async function verifyAccountByAdmin(userId) {
  if (!userId) validationError("userId");
  return userService.verifyUserByAdmin(userId);
}

export default {
  register,
  login,
  googleAuth,
  verifyAccount,
  requestPasswordReset,
  resetPassword,
  changePassword,
  deactivateAccount,
  resendVerificationEmail,
  verifyAccountByAdmin,
};