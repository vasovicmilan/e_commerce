import * as roleRepo from "../repositories/role.repository.js";
import {
  mapRolesForAdminList,
  mapRoleForAdminDetail,
  mapRoleForEdit,
  mapRolesForSelect,
} from "../mappers/role.mapper.js";
import {
  validationError,
  notFound,
  conflict,
  badRequest,
} from "../utils/error.util.js";

export async function listRoles({
  search,
  isDefault,
  isActive,
  limit = 10,
  page = 1,
} = {}) {
  const result = await roleRepo.findRoles({
    search,
    isDefault,
    isActive,
    limit,
    page,
    sort: { priority: -1, name: 1 },
  });

  return {
    data: mapRolesForAdminList(result.data),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getRoleById(roleId) {
  if (!roleId) validationError("roleId");

  const role = await roleRepo.findRoleById(roleId);
  if (!role) notFound("Rola");

  return mapRoleForAdminDetail(role);
}

export async function getRoleForEdit(roleId) {
  if (!roleId) validationError("roleId");

  const role = await roleRepo.findRoleById(roleId);
  if (!role) notFound("Rola");

  return mapRoleForEdit(role);
}

export async function getRolesForSelect() {
  const roles = await roleRepo.findAllRoles({ isActive: true });
  return mapRolesForSelect(roles);
}

export async function findDefaultRole() {
  return roleRepo.findDefaultRole();
}

export async function findRoleByName(name) {
  if (!name) return null;
  return roleRepo.findRoleByName(name);
}

export async function createRole(data) {
  if (!data) validationError("data");
  if (!data.name) validationError("name");

  const existing = await roleRepo.findRoleByName(data.name);
  if (existing) conflict("Rola sa ovim nazivom već postoji");

  const created = await roleRepo.createRole(data);
  const roleObject = created.toObject ? created.toObject() : created;
  return mapRoleForAdminDetail(roleObject);
}

export async function updateRole(roleId, data) {
  if (!roleId) validationError("roleId");
  if (!data || Object.keys(data).length === 0) validationError("data");

  if (data.name) {
    const existing = await roleRepo.findRoleByName(data.name);
    if (existing && String(existing._id) !== String(roleId)) {
      conflict("Rola sa ovim nazivom već postoji");
    }
  }

  const updated = await roleRepo.updateRoleById(roleId, data);
  if (!updated) notFound("Rola");

  return mapRoleForAdminDetail(updated);
}

export async function deleteRole(roleId) {
  if (!roleId) validationError("roleId");

  const role = await roleRepo.findRoleById(roleId);
  if (!role) notFound("Rola");

  if (role.isDefault) {
    badRequest("Ne možete obrisati podrazumevanu rolu");
  }

  const deleted = await roleRepo.deleteRoleById(roleId);
  return { deleted: true, id: roleId };
}

export async function getRoleStats() {
  const total = await roleRepo.countRoles();
  const active = await roleRepo.countRoles({ isActive: true });
  return { total, active, inactive: total - active };
}

export async function createAdminRole() {
  const existing = await roleRepo.findRoleByName("Administrator");
  if (existing) return existing;

  return roleRepo.createRole({
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
  });
}

export default {
  listRoles,
  getRoleById,
  getRoleForEdit,
  getRolesForSelect,
  findDefaultRole,
  findRoleByName,
  createRole,
  updateRole,
  deleteRole,
  getRoleStats,
  createAdminRole,
};