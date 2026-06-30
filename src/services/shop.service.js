import * as itemService from "./item.service.js";
import * as postService from "./post.service.js";
import * as categoryService from "./category.service.js";
import * as tagService from "./tag.service.js";
import * as tempOrderService from "./temporary.order.service.js";
import * as orderService from "./order.service.js";
import * as customerService from "./customer.service.js";
import * as userService from "./user.service.js";
import * as couponService from "./coupon.service.js";
import { buildPageSeo } from "../seo/index.js";
import {
  validationError,
  badRequest,
} from "../utils/error.util.js";

import eventEmitter from "../events/event.emitter.js";
import { logError, logWarn, logInfo } from "../utils/logger.util.js";

import mongoose from "mongoose";

const DEFAULT_SHIPPING_PRICE = Number(process.env.DEFAULT_SHIPPING_PRICE || 540);

export async function getShopLandingData({
  featuredLimit = 4,
  actionedLimit = 4,
  categoryPreviewLimit = 4,
  featuredPostLimit = 4,
} = {}) {
  const [featured, actioned, categories, tags, posts] = await Promise.all([
    itemService.findFeaturedItems({ limit: featuredLimit, page: 1 }),
    itemService.findActionedItems({ limit: actionedLimit, page: 1 }),
    categoryService.getPublicCategories("item"),
    tagService.getPublicTagsGrouped("item"),
    postService.findPublishedPosts({ limit: featuredPostLimit, page: 1 }),
  ]);

  const categoryPreviews = await Promise.all(
    (categories || []).slice(0, 4).map(async (category) => {
      const items = await itemService.findItemsByCategorySlug(category.slug, {
        limit: categoryPreviewLimit,
        page: 1,
      });
      return {
        category: {
          id: category.id,
          name: category.naziv,
          slug: category.slug,
        },
        items: items.data || [],
      };
    })
  );

  const seo = buildPageSeo({
    title: "Prodavnica | TopHelanke",
    description: "Online prodavnica ženske garderobe. Pogledajte aktuelne akcije, nove modele i najprodavanije helanke, fitness komplete, farmerice i pantalone.",
    canonical: "/prodavnica",
    isIndexable: true,
    type: "website",
  });

  return {
    featured: featured.data || [],
    actioned: actioned.data || [],
    posts: posts.data || [],
    categories: categories || [],
    tags: tags || {},
    categoryPreviews,
    seo,
  };
}

export async function getFeaturedItems({ limit = 12, page = 1 } = {}) {
  const result = await itemService.findFeaturedItems({ limit, page });
  const categories = await categoryService.getPublicCategories("item");
  const tags = await tagService.getPublicTagsGrouped("item");

  const seo = buildPageSeo({
    title: "Istaknuti proizvodi | TopHelanke",
    description: "Pregledajte našu kolekciju istaknutih helanki i garderobe.",
    canonical: "/prodavnica/istaknuto",
    isIndexable: false,
  });

  return { ...result, categories, tags, seo };
}

export async function getActionedItems({ limit = 12, page = 1 } = {}) {
  const result = await itemService.findActionedItems({ limit, page });
  const categories = await categoryService.getPublicCategories("item");
  const tags = await tagService.getPublicTagsGrouped("item");

  const seo = buildPageSeo({
    title: "Akcija - Sniženi proizvodi | TopHelanke",
    description: "Iskoristite popuste na našu garderobu.",
    canonical: "/prodavnica/akcija",
    isIndexable: true,
  });

  return { ...result, categories, tags, seo };
}

export async function getPublishedItems({ limit = 12, page = 1 } = {}) {
  const result = await itemService.findPublishedItems({ limit, page });
  const categories = await categoryService.getPublicCategories("item");
  const tags = await tagService.getPublicTagsGrouped("item");

  const seo = buildPageSeo({
    title: "Svi proizvodi | TopHelanke",
    description: "Kompletna ponuda ženske garderobe.",
    canonical: "/prodavnica/svi",
    isIndexable: true,
  });

  return { ...result, categories, tags, seo };
}

export async function getItemDetails(slug) {
  const result = await itemService.getItemBySlug(slug);
  const categories = await categoryService.getPublicCategories("item");
  const tags = await tagService.getPublicTagsGrouped("item");

  return { ...result, categories, tags };
}

export async function getItemsByCategory(slug, { limit = 12, page = 1 } = {}) {
  const [result, categories] = await Promise.all([
    itemService.findItemsByCategorySlug(slug, { limit, page }),
    categoryService.getPublicCategories("item"),
  ]);

  const tags = await tagService.getPublicTagsGroupedByCategory(slug);

  return { ...result, categories, tags };
}

export async function getItemsByTag(slug, type, { limit = 3, page = 1 } = {}) {
  const [result, categories] = await Promise.all([
    itemService.findItemsByTagSlug(slug, type, { limit, page }),
    categoryService.getPublicCategories("item"),
  ]);

  const tags = await tagService.getPublicTagsGrouped("item");

  return { ...result, categories, tags };
}

export async function searchShopItems(search, { limit = 12, page = 1 } = {}) {
  const result = await itemService.searchItems(search, { limit, page });
  const categories = await categoryService.getPublicCategories("item");

  const seo = buildPageSeo({
    title: `Pretraga: ${search} | TopHelanke`,
    description: `Rezultati pretrage za "${search}".`,
    canonical: "/pretraga",
    isIndexable: false,
  });

  return { ...result, categories, seo };
}

export async function addItemRating(userId, itemId, stars, review = "") {
  return itemService.addOrUpdateItemRating(itemId, userId, stars, review);
}

export async function removeItemRating(userId, itemId) {
  return itemService.removeItemRating(itemId, userId);
}

export async function getUserItemRating(userId, itemId) {
  return itemService.getUserItemRating(itemId, userId);
}

export async function getCart({ user, session }) {
  if (user) {
    return userService.getCart(user._id || user.id);
  }

  return {
    items: session?.cart || [],
    empty: !session?.cart || session.cart.length === 0,
  };
}

export async function addToCart({ user, session }, { itemId, variationId, quantity = 1, affiliateCode = null }) {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) validationError("quantity");

  const snapshot = await itemService.getVariationSnapshotForCart(itemId, variationId, affiliateCode);

  const cartItem = {
    ...snapshot,
    itemId: String(snapshot.itemId),
    variationId: String(snapshot.variationId),
    quantity: qty,
  };

  if (user) {
    return userService.addItemToCart(user._id || user.id, cartItem);
  }

  if (!session.cart) session.cart = [];

  const existing = session.cart.find(
    (i) => String(i.itemId) === cartItem.itemId && String(i.variationId) === cartItem.variationId
  );

  if (existing) {
    existing.quantity += qty;
  } else {
    session.cart.push(cartItem);
  }

  session.cartCount = session.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return { items: session.cart, empty: false };
}

export async function removeFromCart({ user, session }, { itemId, variationId, quantity = 1 }) {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) validationError("quantity");

  if (user) {
    const updatedCart = await userService.removeItemFromCart(user._id || user.id, { itemId, variationId, quantity: qty });
    if (session) {
      session.cartCount = updatedCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    }
    return { items: updatedCart, empty: updatedCart.length === 0 };
  }

  if (!session.cart) return { items: [], empty: true };

  const idx = session.cart.findIndex(
    (i) => String(i.itemId) === String(itemId) && String(i.variationId) === String(variationId)
  );

  if (idx === -1) return { items: session.cart, empty: false };

  if (session.cart[idx].quantity <= qty) {
    session.cart.splice(idx, 1);
  } else {
    session.cart[idx].quantity -= qty;
  }

  session.cartCount = session.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return { items: session.cart, empty: session.cart.length === 0 };
}

export async function clearCart({ user, session }) {
  if (user) {
    await userService.clearCart(user._id || user.id);
    if (session) {
      session.cartCount = 0;
    }
    return { items: [], empty: true };
  }

  session.cart = [];
  session.cartCount = 0;
  return { items: [], empty: true };
}

export async function getCartCount({ user, session }) {
  const cart = await getCart({ user, session });
  const items = cart.items || [];
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

export async function getCheckoutData({ user, session }) {
  const cart = await getCart({ user, session });
  const items = cart.items || [];

  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0);
  const shipping = items.length > 0 ? DEFAULT_SHIPPING_PRICE : 0;

  let customer = null;
  if (user) {
    customer = await userService.getMyProfile(user._id || user.id);
  }

  const seo = buildPageSeo({
    title: "Završetak kupovine | TopHelanke",
    description: "Završite kupovinu i potvrdite porudžbinu.",
    canonical: "/prodavnica/checkout",
    isIndexable: false,
  });

  return {
    cart: { items, subtotal, shipping, total: subtotal + shipping },
    customer,
    seo,
  };
}

export async function applyCoupon(code, cartTotal, userId = null, guestEmail = null) {
  if (!code) validationError("code");
  return couponService.applyCouponDiscount(code, cartTotal, userId, guestEmail);
}

export async function createCheckoutTemporaryOrder(data, { user, session: expressSession }) {
  // ── 1. Fetch cart ──────────────────────────────────────────────────────────
  const cart  = await getCart({ user, session: expressSession });
  const items = cart.items || [];
  if (!items.length) badRequest("Korpa je prazna");
 
  // ── 2. Fetch logged-in buyer profile (for saved phones/addresses) ──────────
  let profile = null;
  let userId  = null;
  if (user) {
    userId  = user._id?.toString() || user.id;
    profile = await userService.getMyProfile(userId);
  }
 
  // ── 3. Resolve telephone ──────────────────────────────────────────────────
  const hasNewTelephone = data.hasNewTelephone === "true" || data.hasNewTelephone === true;
  let telephone = null;
 
  if (hasNewTelephone) {
    telephone = data.newTelephone?.trim();
    if (!telephone) validationError("telephone");
  } else if (data.telephoneId) {
    if (!profile) badRequest("Niste ulogovani ili profil nije dostupan");
    const saved = (profile.kontakt?.telefoni || []).find(
      (p) => String(p.id) === String(data.telephoneId)
    );
    if (!saved) badRequest("Sačuvani telefon nije pronađen");
    telephone = saved.value; // decrypted
  }
 
  if (!telephone) validationError("telephone");
 
  // ── 4. Resolve address ────────────────────────────────────────────────────
  const hasNewAddress = data.hasNewAddress === "true" || data.hasNewAddress === true;
  let address = null;
 
  if (hasNewAddress) {
    const { city, street, number, postalCode } = data.newAddress || {};
    if (!city || !street || !number || !postalCode) validationError("address");
    address = { city: city.trim(), street: street.trim(), number: number.trim(), postalCode: postalCode.trim() };
  } else if (data.addressId) {
    if (!profile) badRequest("Niste ulogovani ili profil nije dostupan");
    const saved = (profile.kontakt?.adrese || []).find(
      (a) => String(a.id) === String(data.addressId)
    );
    if (!saved) badRequest("Sačuvana adresa nije pronađena");
    address = { city: saved.city, street: saved.street, number: saved.number, postalCode: saved.postalCode };
  }
 
  if (!address) validationError("address");
 
  // ── 5. Build buyerInfo and resolve existing buyer identity (reads only) ────
  let buyerInfo = {};
  let buyerId   = null;
  let buyerModel = null;
  let isNewCustomer = false; // flag: creation deferred into the transaction
 
  if (user) {
    buyerId    = userId;
    buyerModel = "User";
    buyerInfo  = {
      firstName: profile.osnovno.ime,
      lastName:  profile.osnovno.prezime,
      email:     profile.osnovno.email,
    };
  } else {
    buyerInfo = {
      firstName: (data.buyerInfo?.firstName || "").trim(),
      lastName:  (data.buyerInfo?.lastName  || "").trim(),
      email:     (data.buyerInfo?.email     || "").trim().toLowerCase(),
    };
 
    // Try to find an existing User first
    const existingUser = await userService.findUserByEmail(buyerInfo.email);
    if (existingUser) {
      buyerId    = existingUser._id.toString();
      buyerModel = "User";
    } else {
      // Try to find an existing Customer
      const existingCustomer = await customerService.findCustomerByEmail(buyerInfo.email);
      if (existingCustomer) {
        buyerId    = existingCustomer._id.toString();
        buyerModel = "Customer";
      } else {
        // No entity found — we will create a new Customer INSIDE the transaction
        buyerModel    = "Customer";
        isNewCustomer = true;
        // buyerId will be set after creation inside the transaction
      }
    }
  }
 
  // ── 6. Validate coupon (read-only — before transaction) ───────────────────
  let couponObject = null;
  const couponCode = (data.appliedCoupon || data.couponCode || "").trim();
  if (couponCode) {
    const couponUserId = buyerModel === "User" ? buyerId : null;
    const cartTotal    = items.reduce(
      (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1),
      0
    );
    couponObject = await couponService.validateCouponForCheckout(
      couponCode,
      cartTotal,
      couponUserId,
      buyerInfo.email
    );
  }
 
  // ── 7. Open transaction — ALL writes happen here ──────────────────────────
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
 
  try {
    // ── 7a. Create Customer INSIDE the transaction (C2 fix) ─────────────────
    if (isNewCustomer) {
      const newCustomer = await customerService.resolveCustomerForOrder(
        { ...buyerInfo, acceptance: data.acceptTerms === "true" || data.acceptTerms === true },
        { session: mongoSession } // ← inside the transaction
      );
      buyerId = (newCustomer.customer._id || newCustomer.customer).toString();
    }
 
    // ── 7b. Create TemporaryOrder (decreases stock inside) ───────────────────
    const result = await tempOrderService.createTemporaryOrder(
      {
        buyerId,
        buyerModel,
        buyerInfo,
        telephone,
        address,
        items,
        coupon: couponObject
          ? { couponId: couponObject.id, code: couponObject.code, discount: couponObject.discount }
          : null,
        partner:          data.partner          || null,
        note:             data.note             || "",
        createNewAccount: data.createNewAccount === "true" || data.createNewAccount === true,
        hasNewTelephone,
        hasNewAddress,
      },
      { session: mongoSession }
    );
 
    // ── 7c. Mark coupon used (Phase 1) ────────────────────────────────────────
    if (couponObject) {
      await couponService.markCouponAsUsed(
        couponObject.id,
        result.id,        // temporaryOrderId
        buyerModel === "User" ? buyerId : null,
        buyerInfo.email,
        mongoSession
      );
    }
 
    // ── 7d. Clear cart for logged-in users INSIDE the transaction ─────────────
    if (user) {
      await userRepo.setCart(userId, [], mongoSession);
    }
 
    await mongoSession.commitTransaction();
 
    // ── 8. Clear guest session cart AFTER commit (session IO — cannot be in TX)
    if (!user) {
      expressSession.cart      = [];
      expressSession.cartCount = 0;
      await new Promise((resolve, reject) => {
        expressSession.save((err) => (err ? reject(err) : resolve()));
      });
    }
 
    return result;
  } catch (error) {
    await mongoSession.abortTransaction();
    logError("createCheckoutTemporaryOrder failed", error);
    throw error;
  } finally {
    mongoSession.endSession();
  }
}

export async function confirmOrderByToken(token, orderId) {
  return orderService.confirmOrder(token, orderId);
}

export async function cancelOrder(cancelToken) {
  return orderService.cancelOrderByToken(cancelToken);
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

export async function toggleWishlist(userId, itemId) {
  const inWishlist = await isInWishlist(userId, itemId);
  if (inWishlist) {
    await removeFromWishlist(userId, itemId);
    return { inWishlist: false, action: "removed" };
  } else {
    await addToWishlist(userId, itemId);
    return { inWishlist: true, action: "added" };
  }
}

export async function removeCoupon() {
  return { success: true };
}

export default {
  getShopLandingData,
  getFeaturedItems,
  getActionedItems,
  getPublishedItems,
  getItemDetails,
  getItemsByCategory,
  getItemsByTag,
  searchShopItems,
  addItemRating,
  removeItemRating,
  getUserItemRating,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  toggleWishlist,
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  getCartCount,
  getCheckoutData,
  applyCoupon,
  removeCoupon,
  createCheckoutTemporaryOrder,
  confirmOrderByToken,
  cancelOrder,
};