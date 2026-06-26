import { formatDateTime, formatDate } from "../utils/date.time.util.js";

function translateDiscountType(type) {
  const map = {
    percentage: "Procentualni",
    fixed: "Fiksni",
  };
  return map[type] || type;
}

function formatDiscountValue(value, type) {
  if (type === "percentage") return `${value}%`;
  return `${value} RSD`;
}

function isCurrentlyValid(coupon) {
  const now = new Date();
  if (!coupon.isActive) return false;
  if (coupon.validFrom && new Date(coupon.validFrom) > now) return false;
  if (coupon.validUntil && new Date(coupon.validUntil) < now) return false;
  return true;
}

function isExpired(coupon) {
  if (!coupon.validUntil) return false;
  return new Date(coupon.validUntil) < new Date();
}

function getRemainingUses(coupon) {
  if (coupon.usageLimit === null || coupon.usageLimit === undefined) {
    return "∞";
  }
  return Math.max(0, coupon.usageLimit - coupon.usedCount);
}

function formatUsageLimit(coupon) {
  if (coupon.usageLimit === null || coupon.usageLimit === undefined) {
    return "Neograničeno";
  }
  return `${coupon.usedCount}/${coupon.usageLimit}`;
}

// 🔥 IZMENA: podrška za null (neograničeno po korisniku)
function getUsagePerUserLabel(coupon) {
  if (coupon.usagePerUser === null || coupon.usagePerUser === undefined) {
    return "Neograničeno";
  }
  if (coupon.usagePerUser === 1) return "Jednom";
  return `${coupon.usagePerUser} puta`;
}

function getAllowedUsersList(coupon) {
  if (!coupon.allowedUsers || coupon.allowedUsers.length === 0) {
    return "Svi korisnici";
  }
  const count = coupon.allowedUsers.length;
  if (count <= 3) {
    return coupon.allowedUsers.map(u => u.email || u._id?.toString()).join(", ");
  }
  return `${count} korisnika (${coupon.allowedUsers.slice(0, 2).map(u => u.email || u._id?.toString()).join(", ")}...)`;
}

export function mapCouponsForAdminList(coupons = []) {
  return coupons
    .map((coupon) => {
      if (!coupon) return null;

      return {
        id: coupon._id.toString(),
        kod: coupon.code,
        tip: translateDiscountType(coupon.discountType),
        tipRaw: coupon.discountType,
        popust: formatDiscountValue(coupon.discountValue, coupon.discountType),
        aktivan: coupon.isActive ? "Da" : "Ne",
        validan: isCurrentlyValid(coupon) ? "Da" : "Ne",
        istekao: isExpired(coupon) ? "Da" : "Ne",
        korišćenje: formatUsageLimit(coupon),
        preostalo: getRemainingUses(coupon),
        poKorisniku: getUsagePerUserLabel(coupon),
        ograničenNa: getAllowedUsersList(coupon),
        važiOd: coupon.validFrom ? formatDate(coupon.validFrom) : "Odmah",
        važiDo: coupon.validUntil ? formatDate(coupon.validUntil) : "Bez ograničenja",
        minIznos: coupon.minCartAmount > 0 ? `${coupon.minCartAmount} RSD` : "Nema",
        kreiran: formatDate(coupon.createdAt),
      };
    })
    .filter(Boolean);
}

export function mapCouponForAdminDetail(coupon) {
  if (!coupon) return null;

  const allowedUsersDetails = (coupon.allowedUsers || []).map((user) => {
    if (typeof user === 'object' && user !== null) {
      return {
        id: user._id?.toString() || user.id,
        email: user.email || user._id?.toString(),
      };
    }
    return { id: user?.toString(), email: user?.toString() };
  });

  return {
    id: coupon._id.toString(),
    osnovno: {
      kod: coupon.code,
      tip: translateDiscountType(coupon.discountType),
      tipRaw: coupon.discountType,
      popust: formatDiscountValue(coupon.discountValue, coupon.discountType),
      vrednost: coupon.discountValue,
      aktivan: coupon.isActive,
    },
    korišćenje: {
      limit: coupon.usageLimit === null ? "Neograničeno" : coupon.usageLimit,
      korišćeno: coupon.usedCount,
      preostalo: getRemainingUses(coupon),
      // 🔥 IZMENA: prikaz za usagePerUser
      poKorisniku: coupon.usagePerUser === null ? "Neograničeno" : `${coupon.usagePerUser} puta`,
      minIznosKorpe: coupon.minCartAmount,
    },
    važenje: {
      važiOd: coupon.validFrom ? formatDateTime(coupon.validFrom) : null,
      važiDo: coupon.validUntil ? formatDateTime(coupon.validUntil) : null,
      trenutnoValidan: isCurrentlyValid(coupon),
      istekao: isExpired(coupon),
    },
    ograničenja: {
      allowedUsers: allowedUsersDetails,
      allowedUsersCount: allowedUsersDetails.length,
      isGlobal: allowedUsersDetails.length === 0,
    },
    istorija: (coupon.usedBy || []).map((u) => ({
      userId: u.userId?.toString(),
      temporaryOrderId: u.temporaryOrderId?.toString(),
      iskorišćen: u.usedAt ? formatDateTime(u.usedAt) : null,
      orderId: u.orderId?.toString(),
    })),
    vreme: {
      kreirano: formatDateTime(coupon.createdAt),
      azurirano: formatDateTime(coupon.updatedAt),
    },
  };
}

export function mapCouponForEdit(coupon) {
  if (!coupon) return null;

  return {
    id: coupon._id.toString(),
    code: coupon.code,
    isActive: coupon.isActive,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    usageLimit: coupon.usageLimit,
    // 🔥 IZMENA: čuvamo null kao null
    usagePerUser: coupon.usagePerUser,
    minCartAmount: coupon.minCartAmount,
    validFrom: coupon.validFrom,
    validUntil: coupon.validUntil,
    allowedUsers: (coupon.allowedUsers || []).map((u) => u._id?.toString() || u.id || u),
  };
}

export function mapCouponForCheckout(coupon) {
  if (!coupon) return null;

  return {
    kod: coupon.code,
    tip: coupon.discountType,
    vrednost: coupon.discountValue,
    formatiranPopust: formatDiscountValue(coupon.discountValue, coupon.discountType),
    minIznosKorpe: coupon.minCartAmount,
    validan: isCurrentlyValid(coupon),
    preostalo: getRemainingUses(coupon),
    // 🔥 IZMENA: prikaz za usagePerUser
    poKorisniku: coupon.usagePerUser === null ? "Neograničeno" : `${coupon.usagePerUser} puta`,
  };
}

export function mapCouponRaw(coupon) {
  return coupon;
}

export default {
  mapCouponsForAdminList,
  mapCouponForAdminDetail,
  mapCouponForEdit,
  mapCouponForCheckout,
  mapCouponRaw,
};