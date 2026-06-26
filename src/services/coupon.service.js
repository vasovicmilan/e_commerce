import * as couponRepo from "../repositories/coupon.repository.js";
import * as userRepo from "../repositories/user.repository.js";
import {
  mapCouponsForAdminList,
  mapCouponForAdminDetail,
  mapCouponForEdit,
  mapCouponForCheckout,
} from "../mappers/coupon.mapper.js";
import {
  validationError,
  notFound,
  conflict,
  badRequest,
} from "../utils/error.util.js";

function validateCouponData(data) {
  if (!data) validationError("data");
  if (!data.code) validationError("code");
  if (data.discountValue === undefined || data.discountValue === null) validationError("discountValue");
  if (data.code && data.code.trim().length < 3) validationError("code");
}

function hasGlobalLimit(coupon) {
  return coupon.usageLimit !== null && coupon.usageLimit !== undefined;
}

function isUserAllowed(coupon, userId) {
  if (!coupon.allowedUsers || coupon.allowedUsers.length === 0) return true;
  if (!userId) return false;
  return coupon.allowedUsers.some((id) => id.toString() === userId);
}

function getUserUsageCount(coupon, userId) {
  if (!userId) return 0;
  return (coupon.usedBy || []).filter((entry) => entry.userId.toString() === userId).length;
}

export async function listCoupons({
  search,
  isActive,
  discountType,
  isValid,
  isExpired,
  limit = 10,
  page = 1,
} = {}) {
  const result = await couponRepo.findCoupons({
    search,
    isActive,
    discountType,
    isValid,
    isExpired,
    limit,
    page,
    sort: { createdAt: -1 },
  });
  return {
    data: mapCouponsForAdminList(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getCouponById(couponId) {
  if (!couponId) validationError("couponId");
  const coupon = await couponRepo.findCouponById(couponId);
  if (!coupon) notFound("Kupon");
  return mapCouponForAdminDetail(coupon);
}

export async function getCouponByCode(code) {
  if (!code) validationError("code");
  const coupon = await couponRepo.findCouponByCode(code);
  if (!coupon) notFound("Kupon");
  return mapCouponForAdminDetail(coupon);
}

export async function getCouponRawByCode(code, session = null) {
  if (!code) return null;
  return couponRepo.findCouponByCode(code, session);
}

export async function getCouponForEdit(couponId) {
  if (!couponId) validationError("couponId");
  const coupon = await couponRepo.findCouponById(couponId);
  if (!coupon) notFound("Kupon");
  return mapCouponForEdit(coupon);
}

export async function createCoupon(data) {
  validateCouponData(data);
  const existing = await couponRepo.findCouponByCode(data.code);
  if (existing) conflict("Kupon sa ovim kodom već postoji");

  let isActive = true;
  if (data.isActive !== undefined) {
    if (Array.isArray(data.isActive)) {
      isActive = data.isActive.includes('1');
    } else {
      isActive = Boolean(data.isActive);
    }
  }

  let usagePerUser = null;
  if (data.usagePerUser !== undefined && data.usagePerUser !== null && data.usagePerUser !== "") {
    usagePerUser = Number(data.usagePerUser);
  }

  const couponData = {
    code: data.code.toUpperCase().trim(),
    isActive: isActive,
    discountType: data.discountType || "percentage",
    discountValue: data.discountValue,
    usageLimit: data.usageLimit !== undefined && data.usageLimit !== null && data.usageLimit !== "" ? Number(data.usageLimit) : null,
    usagePerUser: usagePerUser,
    minCartAmount: data.minCartAmount || 0,
    validFrom: data.validFrom || new Date(),
    validUntil: data.validUntil || null,
    allowedUsers: data.allowedUsers && Array.isArray(data.allowedUsers) ? data.allowedUsers : [],
  };

  try {
    const created = await couponRepo.createCoupon(couponData);
    const couponObject = created.toObject ? created.toObject() : created;
    return mapCouponForAdminDetail(couponObject);
  } catch (error) {
    if (error?.code === 11000) conflict("Kupon sa ovim kodom već postoji");
    throw error;
  }
}

export async function updateCoupon(couponId, data) {
  if (!couponId) validationError("couponId");
  if (!data || Object.keys(data).length === 0) validationError("data");

  const updateData = { ...data };

  if ('usageLimit' in updateData) {
    updateData.usageLimit = (updateData.usageLimit === '' || updateData.usageLimit == null) ? null : Number(updateData.usageLimit);
  }

  if ('usagePerUser' in updateData) {
    if (updateData.usagePerUser === '' || updateData.usagePerUser == null) {
      updateData.usagePerUser = null;
    } else {
      updateData.usagePerUser = Number(updateData.usagePerUser);
      if (isNaN(updateData.usagePerUser) || updateData.usagePerUser < 1) {
        badRequest("usagePerUser mora biti broj veći od 0 ili null");
      }
    }
  }

  if ('isActive' in updateData) {
    const val = updateData.isActive;
    if (Array.isArray(val)) {
      updateData.isActive = val.includes('1');
    } else {
      updateData.isActive = Boolean(val);
    }
  }

  if ('allowedUsers' in updateData) {
    let users = updateData.allowedUsers;
    if (typeof users === 'string') {
      users = users ? users.split(',').map(id => id.trim()).filter(Boolean) : [];
    } else if (!Array.isArray(users)) {
      users = [];
    }
    updateData.allowedUsers = users;
  }

  if ('validFrom' in updateData && updateData.validFrom === '') {
    updateData.validFrom = null;
  }

  if ('validUntil' in updateData && updateData.validUntil === '') {
    updateData.validUntil = null;
  }

  if (data.code) {
    updateData.code = data.code.toUpperCase().trim();
    const existing = await couponRepo.findCouponByCode(updateData.code);
    if (existing && String(existing._id) !== String(couponId)) {
      conflict("Kupon sa ovim kodom već postoji");
    }
  }

  const updated = await couponRepo.updateCouponById(couponId, updateData);
  if (!updated) notFound("Kupon");
  return mapCouponForAdminDetail(updated);
}

export async function deleteCoupon(couponId) {
  if (!couponId) validationError("couponId");
  const deleted = await couponRepo.deleteCouponById(couponId);
  if (!deleted) notFound("Kupon");
  return { deleted: true, id: couponId };
}

export async function validateCouponForCheckout(code, cartTotal, userId = null) {
  if (!code) validationError("code");

  const coupon = await couponRepo.findCouponByCode(code);
  if (!coupon) badRequest("Kupon nije pronađen");
  if (!coupon.isActive) badRequest("Kupon nije aktivan");

  const now = new Date();
  if (coupon.validFrom && new Date(coupon.validFrom) > now) badRequest("Kupon još nije aktivan");
  if (coupon.validUntil && new Date(coupon.validUntil) < now) badRequest("Kupon je istekao");

  if (hasGlobalLimit(coupon) && coupon.usedCount >= coupon.usageLimit) {
    badRequest("Kupon je već iskorišćen maksimalan broj puta");
  }

  if (coupon.minCartAmount > 0 && cartTotal < coupon.minCartAmount) {
    badRequest(`Minimalni iznos korpe za ovaj kupon je ${coupon.minCartAmount} RSD`);
  }

  if (!userId) {
    if (coupon.allowedUsers && coupon.allowedUsers.length > 0) {
      badRequest("Ovaj kupon je ograničen na određene korisnike. Molimo prijavite se.");
    }
    if (coupon.usagePerUser !== null) {
      badRequest("Ovaj kupon ima ograničenje po korisniku. Molimo prijavite se.");
    }
    return mapCouponForCheckout(coupon);
  }

  if (!isUserAllowed(coupon, userId)) {
    badRequest("Ovaj kupon nije namenjen vama");
  }

  if (coupon.usagePerUser !== null) {
    const userUsage = getUserUsageCount(coupon, userId);
    if (userUsage >= coupon.usagePerUser) {
      badRequest(`Već ste iskoristili ovaj kupon ${userUsage} put(a). Dozvoljeno: ${coupon.usagePerUser}`);
    }
  }

  return mapCouponForCheckout(coupon);
}

export async function applyCouponDiscount(couponCode, cartTotal, userId = null) {
  await validateCouponForCheckout(couponCode, cartTotal, userId);

  const coupon = await couponRepo.findCouponByCode(couponCode);
  if (!coupon) return { discount: 0, finalTotal: cartTotal };

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = (cartTotal * coupon.discountValue) / 100;
  } else {
    discount = Math.min(coupon.discountValue, cartTotal);
  }

  return {
    discount: Math.round(discount * 100) / 100,
    finalTotal: Math.round((cartTotal - discount) * 100) / 100,
    coupon: mapCouponForCheckout(coupon),
  };
}

// 🔥 Phase 1: Mark coupon as used with temporaryOrderId
export async function markCouponAsUsed(couponId, temporaryOrderId, userId, session = null) {
  if (!couponId) return null;
  const coupon = await couponRepo.findCouponById(couponId, null, session, false);
  if (!coupon) return null;

  if (hasGlobalLimit(coupon)) {
    coupon.usedCount += 1;
  }

  if (userId) {
    coupon.usedBy.push({
      userId,
      temporaryOrderId,
      usedAt: new Date(),
      orderId: null,
    });
  }

  await coupon.save({ session });
  return coupon;
}

// 🔥 Phase 2: Update usage with orderId after confirmation (oslobađa temporaryOrderId)
export async function updateCouponUsedByOrder(couponId, userId, temporaryOrderId, orderId, session = null) {
  if (!couponId || !userId || !temporaryOrderId || !orderId) return null;

  const coupon = await couponRepo.findCouponById(couponId, null, session, false);
  if (!coupon) return null;

  const entry = coupon.usedBy.find(
    (u) => u.userId.toString() === userId.toString() &&
           u.temporaryOrderId && u.temporaryOrderId.toString() === temporaryOrderId.toString()
  );

  if (entry) {
    entry.orderId = orderId;
    entry.temporaryOrderId = null; // 🔥 Oslobađamo referencu jer temporary order više ne postoji
    entry.usedAt = new Date();
    await coupon.save({ session });
  }

  return coupon;
}

// 🔥 Release coupon (remove usage and decrement count) - koristi temporaryOrderId
export async function releaseCoupon(couponId, userId, temporaryOrderId, session = null) {
  if (!couponId || !userId || !temporaryOrderId) return null;

  const coupon = await couponRepo.findCouponById(couponId, null, session, false);
  if (!coupon) return null;

  const initialLength = coupon.usedBy.length;
  coupon.usedBy = coupon.usedBy.filter(
    (u) => !(u.userId.toString() === userId.toString() &&
             u.temporaryOrderId && u.temporaryOrderId.toString() === temporaryOrderId.toString())
  );

  if (coupon.usedBy.length < initialLength) {
    if (hasGlobalLimit(coupon)) {
      coupon.usedCount = Math.max(0, coupon.usedCount - 1);
    }
    await coupon.save({ session });
  }

  return coupon;
}

export async function getCouponStats() {
  const [total, byStatus, byType, totalUsage] = await Promise.all([
    couponRepo.countCoupons(),
    couponRepo.countCouponsByStatus(),
    couponRepo.countCouponsByType(),
    couponRepo.getTotalCouponUsage(),
  ]);
  return { total, byStatus, byType, totalUsage };
}

export default {
  listCoupons,
  getCouponById,
  getCouponByCode,
  getCouponRawByCode,
  getCouponForEdit,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCouponForCheckout,
  applyCouponDiscount,
  markCouponAsUsed,
  updateCouponUsedByOrder,
  releaseCoupon,
  getCouponStats,
};