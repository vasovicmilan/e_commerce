function formatCurrency(amount) {
  if (!amount && amount !== 0) return "0 RSD";
  return `${amount.toLocaleString()} RSD`;
}

function formatDateTime(date) {
  if (!date) return "Nepoznato";
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}.${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function getStatusLabel(status) {
  const labels = {
    pending: "Na čekanju",
    confirmed: "Potvrđena",
    processing: "U obradi",
    shipped: "Poslata",
    delivered: "Isporučena",
    completed: "Završena",
    cancelled: "Otkazana",
    returned: "Vraćena",
    refunded: "Refundirana",
    failed: "Neuspešna",
    temporary: "Privremene",   // ← dodato
  };
  return labels[status] || status;
}

function getStatusClass(status) {
  const classes = {
    pending: "warning",
    confirmed: "info",
    processing: "primary",
    shipped: "info",
    delivered: "success",
    completed: "success",
    cancelled: "danger",
    returned: "secondary",
    refunded: "secondary",
    failed: "danger",
    temporary: "secondary",    // ← dodato
  };
  return classes[status] || "secondary";
}

function getStatusIcon(status) {
  const icons = {
    pending: "bi-clock-history",
    confirmed: "bi-check-circle",
    processing: "bi-arrow-repeat",
    shipped: "bi-truck",
    delivered: "bi-check2-circle",
    completed: "bi-check-all",
    cancelled: "bi-x-circle",
    returned: "bi-arrow-return-left",
    refunded: "bi-cash-stack",
    failed: "bi-exclamation-triangle",
    temporary: "bi-hourglass",   // ← dodato
  };
  return icons[status] || "bi-question-circle";
}

export function prepareAdminDashboardData(stats) {
  const orderStats = stats.orders || {};
  const orderByStatus = orderStats.byStatus || {};
  const itemStats = stats.items || {};
  const itemByStatus = itemStats.byStatus || {};
  const userStats = stats.users || {};
  const userByStatus = userStats.byStatus || {};
  const couponStats = stats.coupons || {};
  const couponByStatus = couponStats.byStatus || {};
  const contactStats = stats.contacts || {};
  const categoryStats = stats.categories || {};
  const tagStats = stats.tags || {};
  const postStats = stats.posts || {};
  const customerStats = stats.customers || {};
  const temporaryOrders = stats.temporaryOrders || 0;

  // --- Kartice sa sažetkom ---
  const summaryCards = [
    {
      title: "Porudžbine",
      value: orderStats.total || 0,
      icon: "bi-cart",
      color: "primary",
      link: "/admin/porudzbine",
      subValue: `${orderStats.active || 0} aktivnih, ${temporaryOrders} privremenih`,
    },
    {
      title: "Prihod (ukupno)",
      value: formatCurrency(orderStats.totalRevenue || 0),
      icon: "bi-currency-dollar",
      color: "success",
      link: "/admin/porudzbine",
    },
    {
      title: "Korisnici",
      value: userStats.total || 0,
      icon: "bi-people",
      color: "info",
      link: "/admin/korisnici",
    },
    {
      title: "Artikli",
      value: itemStats.total || 0,
      icon: "bi-box",
      color: "warning",
      link: "/admin/artikli",
      subValue: `${itemByStatus.published || 0} objavljeno`,
    },
    {
      title: "Blog postovi",
      value: postStats.total || 0,
      icon: "bi-journal",
      color: "secondary",
      link: "/admin/blog",
      subValue: `${postStats.published || 0} objavljeno`,
    },
    {
      title: "Kupci",
      value: customerStats.total || 0,
      icon: "bi-person-badge",
      color: "dark",
      link: "/admin/kupci",
      subValue: `${customerStats.withOrders || 0} sa porudžbinama`,
    },
    {
      title: "Kuponi",
      value: couponByStatus.active || 0,
      icon: "bi-ticket-perforated",
      color: "danger",
      link: "/admin/kuponi",
      subValue: `${couponStats.totalUsage || 0} iskorišćeno`,
    },
    {
      title: "Kontakt poruke",
      value: contactStats.newCount || 0,
      icon: "bi-envelope",
      color: "danger",
      link: "/admin/kontakt",
      subValue: `${contactStats.total || 0} ukupno`,
    },
  ];

  // --- Statusi porudžbina (uključujući privremene) ---
  const allStatuses = [
    "pending", "confirmed", "processing", "shipped",
    "delivered", "completed", "cancelled", "returned",
    "refunded", "failed"
  ];

  const orderStatusStats = allStatuses.map((status) => ({
    status,
    label: getStatusLabel(status),
    count: orderByStatus[status] || 0,
    color: getStatusClass(status),
  }));

  // Dodaj privremene kao poseban red
  orderStatusStats.push({
    status: "temporary",
    label: "Privremene",
    count: temporaryOrders,
    color: "secondary",
  });

  // --- Objekat za view ---
  return {
    summaryCards,
    stats: {
      orders: {
        total: orderStats.total || 0,
        active: orderStats.active || 0,
        completed: orderStats.completed || 0,
        temporary: temporaryOrders,
        totalRevenue: formatCurrency(orderStats.totalRevenue || 0),
        monthlyRevenue: formatCurrency(orderStats.recentRevenue?.total || 0),
        byStatus: orderByStatus,
        byStatusList: orderStatusStats,
        ...allStatuses.reduce((acc, s) => { acc[s] = orderByStatus[s] || 0; return acc; }, {}),
      },
      items: {
        total: itemStats.total || 0,
        published: itemByStatus.published || 0,
        featured: itemByStatus.featured || 0,
        actioned: itemByStatus.actioned || 0,
        empty: itemStats.totalStock === 0 ? itemStats.total : 0,
        byStatus: itemByStatus,
      },
      posts: {
        total: postStats.total || 0,
        published: postStats.published || 0,
        featured: postStats.featured || 0,
        notPublished: postStats.notPublished || 0,
        byStatus: postStats.byStatus || {},
      },
      users: {
        total: userStats.total || 0,
        active: userByStatus.active || 0,
        pending: userByStatus.pending || 0,
        suspended: userByStatus.suspended || 0,
        inactive: userByStatus.inactive || 0,
        newThisMonth: userStats.newThisMonth || 0,
        activeThisWeek: userStats.activeThisWeek || 0,
        byStatus: userByStatus,
        byRole: userStats.byRole || {},
        byProvider: userStats.byProvider || {},
      },
      customers: {
        total: customerStats.total || 0,
        withOrders: customerStats.withOrders || 0,
      },
      coupons: {
        total: couponStats.total || 0,
        active: couponByStatus.active || 0,
        usedCount: couponStats.totalUsage || 0,
        byStatus: couponByStatus,
        byType: couponStats.byType || {},
      },
      contacts: {
        total: contactStats.total || 0,
        new: contactStats.newCount || 0,
        read: contactStats.byStatus?.read || 0,
        replied: contactStats.byStatus?.replied || 0,
        archived: contactStats.byStatus?.archived || 0,
        byStatus: contactStats.byStatus || {},
      },
      newsletters: {
        total: stats.newsletters?.total || 0,
        active: stats.newsletters?.active || 0,
        inactive: stats.newsletters?.inactive || 0,
      },
      categories: {
        total: categoryStats.total || 0,
        itemCategories: categoryStats.byDomain?.item || 0,
        postCategories: categoryStats.byDomain?.post || 0,
        byDomain: categoryStats.byDomain || {},
        byStatus: categoryStats.byStatus || {},
      },
      tags: {
        total: tagStats.total || 0,
        itemTags: tagStats.byDomain?.item || 0,
        postTags: tagStats.byDomain?.post || 0,
        byDomain: tagStats.byDomain || {},
        byType: tagStats.byType || {},
        byStatus: tagStats.byStatus || {},
      },
    },
    lastUpdated: formatDateTime(new Date()),
  };
}

export function prepareAdminDashboardSeo() {
  return {
    pageTitle: "Admin Dashboard | TopHelanke",
    pageDescription: "Administratorski panel za upravljanje prodavnicom",
    robots: "noindex, nofollow",
  };
}

export default {
  prepareAdminDashboardData,
  prepareAdminDashboardSeo,
};