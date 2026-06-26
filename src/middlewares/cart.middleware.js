export function cartCountMiddleware(req, res, next) {
  let cartCount = 0;

  if (req.session?.user?.id) {
    cartCount = req.session.cartCount || 0;
  } else if (Array.isArray(req.session?.cart)) {
    cartCount = req.session.cart.reduce((total, item) => total + (item.quantity || 0), 0);
    req.session.cartCount = cartCount;
  }

  res.locals.cartCount = cartCount;
  res.locals.cartItemCount = cartCount;
  next();
}