import { formatDateTime, formatDate } from "../utils/date.time.util.js";

export function translatePermission(permission) {
  const map = {
    view_dashboard: "Pregled dashboard-a",
    view_analytics: "Pregled analitike",

    manage_items: "Upravljanje artiklima",
    view_items: "Pregled artikala",
    edit_items: "Izmena artikala",
    delete_items: "Brisanje artikala",
    manage_variations: "Upravljanje varijacijama",
    manage_item_seo: "Upravljanje SEO-om artikala",

    manage_categories: "Upravljanje kategorijama",
    manage_tags: "Upravljanje tagovima",

    view_orders: "Pregled porudžbina",
    manage_orders: "Upravljanje porudžbinama",
    change_order_status: "Promena statusa porudžbine",
    cancel_orders: "Otkazivanje porudžbina",
    view_temporary_orders: "Pregled privremenih porudžbina",
    confirm_temporary_orders: "Potvrda privremenih porudžbina",

    view_customers: "Pregled kupaca",
    edit_customers: "Izmena kupaca",
    delete_customers: "Brisanje kupaca",
    view_users: "Pregled korisnika",
    edit_users: "Izmena korisnika",
    manage_user_roles: "Upravljanje rolama korisnika",
    delete_users: "Brisanje korisnika",

    manage_posts: "Upravljanje postovima",
    manage_post_content: "Upravljanje sadržajem postova",
    manage_post_seo: "Upravljanje SEO-om postova",

    manage_coupons: "Upravljanje kuponima",
    view_contacts: "Pregled kontakata",
    manage_contacts: "Upravljanje kontaktima",
    view_newsletters: "Pregled newsletter-a",
    manage_newsletters: "Upravljanje newsletter-om",
    manage_newsletter_campaigns: "Upravljanje kampanjama",

    manage_settings: "Upravljanje podešavanjima",
    view_logs: "Pregled logova",
  };
  return map[permission] || permission;
}

export function mapRolesForAdminList(roles = []) {
  return roles
    .map((role) => {
      if (!role) return null;
      return {
        id: role._id.toString(),
        naziv: role.name,
        opis: role.description || "",
        brojPermisija: (role.permissions || []).length,
        podrazumevana: role.isDefault ? "Da" : "Ne",
        aktivna: role.isActive ? "Da" : "Ne",
        prioritet: role.priority,
        kreirana: formatDate(role.createdAt),
      };
    })
    .filter(Boolean);
}

export function mapRoleForAdminDetail(role) {
  if (!role) return null;

  return {
    id: role._id.toString(),
    osnovno: {
      naziv: role.name,
      opis: role.description || "",
      podrazumevana: role.isDefault,
      aktivna: role.isActive,
      prioritet: role.priority,
    },
    permisije: (role.permissions || []).map((p) => ({
      kod: p,
      naziv: translatePermission(p),
    })),
    vreme: {
      kreirano: formatDateTime(role.createdAt),
      azurirano: formatDateTime(role.updatedAt),
    },
  };
}

export function mapRoleForEdit(role) {
  if (!role) return null;

  return {
    id: role._id.toString(),
    name: role.name,
    description: role.description || "",
    permissions: role.permissions || [],
    isDefault: role.isDefault,
    isActive: role.isActive,
    priority: role.priority,
  };
}

export function mapRolesForSelect(roles = []) {
  return roles.map((role) => ({
    id: role._id.toString(),
    naziv: role.name,
    prioritet: role.priority,
  }));
}

export function mapRoleRaw(role) {
  return role;
}

export default {
  mapRolesForAdminList,
  mapRoleForAdminDetail,
  mapRoleForEdit,
  mapRolesForSelect,
  mapRoleRaw,
};