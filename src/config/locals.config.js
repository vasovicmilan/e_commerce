export function setupLocals(app) {
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/api")) return next();

    const user = req.session?.user || null;

    res.locals.isAuthenticated = Boolean(user);
    res.locals.user = user;
    res.locals.userName = user?.firstName || "";
    res.locals.userId = user?.id || null;
    res.locals.userEmail = user?.email || "";

    const userRole = user?.roleName || user?.role || "guest";
    res.locals.userRole = userRole;

    res.locals.isAdmin = userRole === "Administrator" || user?.role === "Administrator" || user?.roleName === "Administrator";

    res.locals.isPartner = user?.isPartner === true || user?.partner?.isPartner === true;

    res.locals.isGuest = !user;

    res.locals.BASE_URL = process.env.BASE_URL || "https://www.tophelanke.com";
    res.locals.SITE_NAME = process.env.SITE_NAME || "TopHelanke";
    res.locals.CURRENT_YEAR = new Date().getFullYear();
    res.locals.NODE_ENV = process.env.NODE_ENV || "development";

    res.locals.currentPath = req.originalUrl;
    res.locals.isAdminRoute = req.originalUrl.startsWith("/admin");

    if (typeof res.locals.cartCount === "undefined") {
      res.locals.cartCount = 0;
      res.locals.cartItemCount = 0;
    }

    // Pročitaj sve flash poruke odjednom (ovo ih prazni)
    const flashMessages = req.flash ? req.flash() : {};

    // Postavi pojedinačne varijable za flash-messages parcijal
    res.locals.success = flashMessages.success || [];
    res.locals.error = flashMessages.error || [];
    res.locals.warning = flashMessages.warning || [];
    res.locals.info = flashMessages.info || [];

    // Opciono, ako negde treba ceo objekat
    res.locals.flash = flashMessages;

    next();
  });
}