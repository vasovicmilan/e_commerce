import { Schema, model } from "mongoose";

export const PERMISSIONS = [
  // Dashboard
  "view_dashboard",
  "view_analytics",

  // Items
  "manage_items",
  "view_items",
  "edit_items",
  "delete_items",
  "manage_variations",
  "manage_item_seo",

  // Categories & Tags
  "manage_categories",
  "manage_tags",

  // Orders
  "view_orders",
  "manage_orders",
  "change_order_status",
  "cancel_orders",
  "view_temporary_orders",
  "confirm_temporary_orders",

  // Customers & Users
  "view_customers",
  "edit_customers",
  "delete_customers",
  "view_users",
  "edit_users",
  "manage_user_roles",
  "delete_users",

  // Blog
  "manage_posts",
  "manage_post_content",
  "manage_post_seo",

  // Marketing
  "manage_coupons",
  "view_contacts",
  "manage_contacts",
  "view_newsletters",
  "manage_newsletters",
  "manage_newsletter_campaigns",

  // Settings
  "manage_settings",
  "view_logs",
];

const RoleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    permissions: [
      {
        type: String,
        enum: PERMISSIONS,
      },
    ],
    isDefault: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

RoleSchema.index({ isDefault: 1 });

export default model("Role", RoleSchema);