import * as shopService from "../../../../services/shop.service.js";

// ============================================================
//  POMOĆNA FUNKCIJA ZA PROVERU VALIDACIONIH GREŠAKA
// ============================================================

function handleValidationErrors(req, res) {
  if (req.validationErrors) {
    return res.status(400).json({
      success: false,
      errors: req.validationErrors,
      message: Object.values(req.validationErrors).join(', ') || 'Validacija nije uspela'
    });
  }
  return null;
}

// ============================================================
//  KORPA
// ============================================================

export async function getCart(req, res, next) {
  try {
    const user = req.user || null;
    const session = req.session;
    const cart = await shopService.getCart({ user, session });
    return res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
}

export async function addToCart(req, res, next) {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const user = req.user || null;
    const session = req.session;
    const { itemId, variationId, quantity = 1, affiliateCode = null } = req.body;

    const result = await shopService.addToCart(
      { user, session },
      { itemId, variationId, quantity, affiliateCode }
    );

    const cartCount = await shopService.getCartCount({ user, session });
    req.session.cartCount = cartCount;

    return res.json({
      success: true,
      data: { items: result.items || result, cartCount },
    });
  } catch (error) {
    next(error);
  }
}

export async function removeFromCart(req, res, next) {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const user = req.user || null;
    const session = req.session;
    const { itemId, variationId, quantity = 1 } = req.body;

    const result = await shopService.removeFromCart(
      { user, session },
      { itemId, variationId, quantity }
    );

    const cartCount = await shopService.getCartCount({ user, session });
    req.session.cartCount = cartCount;

    return res.json({
      success: true,
      data: { items: result.items || result, cartCount },
    });
  } catch (error) {
    next(error);
  }
}

export async function clearCart(req, res, next) {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const user = req.user || null;
    const session = req.session;

    await shopService.clearCart({ user, session });

    const cartCount = await shopService.getCartCount({ user, session });
    req.session.cartCount = cartCount;

    return res.json({
      success: true,
      data: { items: [], cartCount: 0 },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCartCount(req, res, next) {
  try {
    const user = req.user || null;
    const session = req.session;
    const count = await shopService.getCartCount({ user, session });
    req.session.cartCount = count;
    return res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
}

// ============================================================
//  KUPONI
// ============================================================

export async function applyCoupon(req, res, next) {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { code } = req.body;
    const user = req.user || null;
    const session = req.session;
    const cart = await shopService.getCart({ user, session });
    const cartTotal = (cart.items || []).reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );

    // 🔥 Izvuci userId ako postoji
    const userId = user?._id || user?.id || null;

    // 🔥 Prosledi userId u shopService.applyCoupon
    const result = await shopService.applyCoupon(code, cartTotal, userId);

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function removeCoupon(req, res, next) {
  try {
    const user = req.user || null;
    const session = req.session;
    const cart = await shopService.getCart({ user, session });
    const cartTotal = (cart.items || []).reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );

    return res.json({
      success: true,
      data: { discount: 0, finalTotal: cartTotal },
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================
//  LISTA ŽELJA
// ============================================================

export async function toggleWishlist(req, res, next) {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Morate biti prijavljeni",
      });
    }

    const { itemId } = req.body;
    const result = await shopService.toggleWishlist(userId, itemId);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// ============================================================
//  OCENE (RATING)
// ============================================================

export async function addRating(req, res, next) {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Morate biti prijavljeni",
      });
    }

    const { itemId, stars, review = "" } = req.body;
    const result = await shopService.addItemRating(userId, itemId, stars, review);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function removeRating(req, res, next) {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Morate biti prijavljeni",
      });
    }

    const { itemId } = req.body;
    const result = await shopService.removeItemRating(userId, itemId);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// ============================================================
//  OSTALO (addToWishlist, removeFromWishlist, isInWishlist)
// ============================================================

export async function addToWishlist(req, res, next) {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Morate biti prijavljeni",
      });
    }

    const { itemId } = req.body;
    const result = await shopService.addToWishlist(userId, itemId);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function removeFromWishlist(req, res, next) {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Morate biti prijavljeni",
      });
    }

    const { itemId } = req.body;
    const result = await shopService.removeFromWishlist(userId, itemId);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function isInWishlist(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { itemId } = req.query;

    if (!userId) {
      return res.json({ success: true, data: { inWishlist: false } });
    }

    const result = await shopService.isInWishlist(userId, itemId);
    return res.json({ success: true, data: { inWishlist: result } });
  } catch (error) {
    next(error);
  }
}

export default {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  getCartCount,
  applyCoupon,
  removeCoupon,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  addRating,
  removeRating,
  toggleWishlist
};