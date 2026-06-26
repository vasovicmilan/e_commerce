export function prepareShopHomeData(data) {
  return {
    featured: data.featured || [],
    actioned: data.actioned || [],
    categories: data.categories || [],
    tags: data.tags || {},
    categoryPreviews: data.categoryPreviews || [],
    posts: data.posts || [],
    seo: data.seo,
  };
}

export function prepareProductData(data) {
  const item = data.item || {};
  const variations = item.varijacije || [];

  const mainImage = item.slike?.istaknuta || null;
  const galleryImages = item.slike?.galerija || [];

  const variationsForJs = variations.map((v) => ({
    id: v.id,
    price: v.naAkciji && v.akcijskaCena ? v.akcijskaCena : v.cena,
    image: v.slikaUrl || mainImage,
    imageAlt: v.slika?.opis || v.boja || "",
    inStock: v.naStanju,
    size: v.velicina,
    color: v.boja,
    amount: v.kolicina,
    measurements: v.merenja || null,
    measurementsRaw: v.merenjaRaw || null,
  }));

  return {
    item,
    categories: data.categories || [],
    tags: data.tags || [],
    seo: data.seo || {},
    gallery: { main: mainImage, images: galleryImages },
    variationsForJs,
    initialPrice: variations[0]?.naAkciji && variations[0]?.akcijskaCena
      ? variations[0].akcijskaCena
      : variations[0]?.cena || "0",
    breadcrumbs: [],
    upSellItems: item.upSellItems || [],
    crossSellItems: item.crossSellItems || [],
  };
}

export function prepareListingData(data) {
  return {
    items: data.data || [],
    categories: data.categories || [],
    tags: data.tags || {},
    total: data.total || 0,
    pagination: {
      currentPage: data.page || 1,
      totalPages: data.totalPages || 1,
      basePath: data.basePath || "",
      query: data.query || {},
    },
    seo: data.seo || {},
    title: data.category?.name || data.tag?.name || "",
    description: data.seo?.pageDescription || "",
  };
}

export function prepareSearchData(data) {
  return {
    search: data.search || "",
    items: data.data || [],
    categories: data.categories || [],
    total: data.total || 0,
    pagination: {
      currentPage: data.page || 1,
      totalPages: data.totalPages || 1,
      basePath: "/prodavnica/pretraga",
      query: { q: data.search },
    },
    seo: data.seo || {},
  };
}

export function prepareCartData(cart) {
  const items = cart.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);

  return {
    items,
    empty: !items.length,
    subtotal,
    itemCount: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
  };
}

export function prepareCheckoutData(data) {
  const cart = data.cart || {};
  const customer = data.customer || null;

  // Pripremi customer tako da svaka adresa ima polje `punaAdresa`
  let preparedCustomer = customer;
  if (customer && customer.kontakt) {
    preparedCustomer = {
      ...customer,
      kontakt: {
        ...customer.kontakt,
        adrese: (customer.kontakt.adrese || []).map((addr) => ({
          ...addr,
          punaAdresa: `${addr.street} ${addr.number}, ${addr.postalCode} ${addr.city}`,
        })),
      },
    };
  }

  return {
    cart: {
      items: cart.items || [],
      subtotal: cart.subtotal || 0,
      shipping: cart.shipping || 0,
      total: cart.total || 0,
      empty: !(cart.items || []).length,
      itemCount: (cart.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0),
    },
    customer: preparedCustomer,
    seo: data.seo || {},
    errors: {},
    formData: {},
    prefillCoupon: "",
    affiliateCode: "",
  };
}

export function prepareOrderCreatedData(result) {
  return {
    orderId: result.id,
    tokenExpiration: result.tokenExpiration,
    email: result.email || "",
  };
}

export function prepareOrderConfirmedData(result) {
  return {
    orderId: result.id,
    cancelToken: result.cancelToken,
    totalPrice: result.totalPrice,
  };
}

export function prepareOrderCancelledData() {
  return {};
}