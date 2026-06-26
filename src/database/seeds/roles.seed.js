import Role from "../../models/role.model.js";

const defaultRoles = [
  {
    name: "Administrator",
    description: "Puni pristup svim funkcionalnostima",
    permissions: [
      "view_dashboard", "view_analytics",
      "manage_items", "view_items", "edit_items", "delete_items",
      "manage_variations", "manage_item_seo",
      "manage_categories", "manage_tags",
      "view_orders", "manage_orders", "change_order_status",
      "cancel_orders", "view_temporary_orders", "confirm_temporary_orders",
      "view_customers", "edit_customers", "delete_customers",
      "view_users", "edit_users", "manage_user_roles", "delete_users",
      "manage_posts", "manage_post_content", "manage_post_seo",
      "manage_coupons",
      "view_contacts", "manage_contacts",
      "view_newsletters", "manage_newsletters", "manage_newsletter_campaigns",
      "manage_settings", "view_logs",
    ],
    isDefault: false,
    priority: 100,
  },
  {
    name: "Moderator",
    description: "Upravljanje sadržajem i porudžbinama",
    permissions: [
      "view_dashboard",
      "manage_items", "view_items", "edit_items",
      "manage_variations", "manage_item_seo",
      "manage_categories", "manage_tags",
      "view_orders", "manage_orders", "change_order_status",
      "view_temporary_orders", "confirm_temporary_orders",
      "view_customers",
      "manage_posts", "manage_post_content", "manage_post_seo",
      "manage_coupons",
      "view_contacts", "manage_contacts",
      "view_newsletters",
    ],
    isDefault: false,
    priority: 50,
  },
  {
    name: "SEO Specialist",
    description: "Samo SEO i sadržaj",
    permissions: [
      "view_dashboard",
      "view_items",
      "manage_item_seo",
      "manage_categories", "manage_tags",
      "manage_posts", "manage_post_content", "manage_post_seo",
      "manage_coupons",
      "view_contacts",
      "view_newsletters",
    ],
    isDefault: false,
    priority: 25,
  },
  {
    name: "Customer",
    description: "Običan korisnik - kupac",
    permissions: [
      "view_dashboard",
      "view_items",
      "view_orders",
      "view_customers",
    ],
    isDefault: true,
    priority: 0,
  },
  {
    name: "Support",
    description: "Podrška kupcima, pregled porudžbina i kontakta",
    permissions: [
      "view_dashboard",
      "view_items",
      "view_orders", "change_order_status",
      "view_customers",
      "view_contacts", "manage_contacts",
      "view_newsletters",
    ],
    isDefault: false,
    priority: 10,
  },
];

export async function seedRoles() {
  for (const roleData of defaultRoles) {
    await Role.findOneAndUpdate(
      { name: roleData.name },
      roleData,
      { upsert: true, new: true }
    );
  }
  console.log("✅ Default roles seeded");
}