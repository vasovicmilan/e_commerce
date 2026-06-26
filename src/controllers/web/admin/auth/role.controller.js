import * as roleService from "../../../../services/role.service.js";
import {
  prepareRoleListData,
  prepareRoleDetailsData,
  prepareRoleFormData,
} from "../../../../presenters/admin/role.presenter.js";
import { logError, logWarn, logInfo } from "../../../../utils/logger.util.js";   // ← dodato

export async function listRoles(req, res, next) {
  try {
    const { search, isDefault, isActive, page = 1, limit = 10 } = req.query;

    const result = await roleService.listRoles({
      search: search || req.params.search,
      isDefault: isDefault === "true" ? true : isDefault === "false" ? false : undefined,
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });

    const viewData = prepareRoleListData(result, req.query);

    return res.render("admin/_list", {
      pageTitle: search ? `Pretraga: ${search}` : "Role",
      pageDescription: "Pregled svih rola i permisija",
      data: viewData,
    });
  } catch (error) {
    logError(`[listRoles] Greška pri učitavanju lista rola`, error, {
      search: req.query.search,
      isDefault: req.query.isDefault,
      isActive: req.query.isActive,
      page: req.query.page,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function roleDetails(req, res, next) {
  try {
    const { roleId } = req.params;

    const role = await roleService.getRoleById(roleId);
    const viewData = prepareRoleDetailsData(role);

    const isEdit = req.path.includes("/izmena/");

    if (isEdit) {
      const formData = prepareRoleFormData(role);
      return res.render("admin/_form", {
        pageTitle: `Izmena - ${role.osnovno.naziv}`,
        pageDescription: role.osnovno.opis || role.osnovno.naziv,
        data: { ...formData, errors: {}, formData: {} },
      });
    }

    return res.render("admin/_details", {
      pageTitle: `Rola - ${role.osnovno.naziv}`,
      pageDescription: role.osnovno.opis || role.osnovno.naziv,
      data: viewData,
    });
  } catch (error) {
    logError(`[roleDetails] Greška pri učitavanju detalja role`, error, {
      roleId: req.params.roleId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function newRoleForm(req, res, next) {
  try {
    const formData = prepareRoleFormData();

    return res.render("admin/_form", {
      pageTitle: "Nova rola",
      pageDescription: "Kreiraj novu rolu sa permisijama",
      data: { ...formData, errors: {}, formData: {} },
    });
  } catch (error) {
    logError(`[newRoleForm] Greška pri prikazu forme za novu rolu`, error, {
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export async function createRole(req, res, next) {
  try {
    if (req.validationErrors) {
      logWarn(`[createRole] Validacione greške pri kreiranju role`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
        body: req.body,
      });
      const formData = prepareRoleFormData();

      return res.render("admin/_form", {
        pageTitle: "Nova rola",
        pageDescription: "Kreiraj novu rolu sa permisijama",
        data: { ...formData, errors: req.validationErrors, formData: req.body },
      });
    }

    const data = {
      name: req.body.name,
      description: req.body.description || "",
      permissions: Array.isArray(req.body.permissions) ? req.body.permissions : [],
      isDefault: req.body.isDefault === "true" || req.body.isDefault === true || req.body.isDefault === "1",
      isActive: req.body.isActive === "true" || req.body.isActive === true || req.body.isActive === "1",
      priority: parseInt(req.body.priority, 10) || 0,
    };

    const role = await roleService.createRole(data);

    logInfo(`[createRole] Rola "${role.osnovno.naziv}" uspešno kreirana`, {
      roleId: role.id,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Rola je uspešno kreirana");
    return res.redirect(`/admin/uloge/detalji/${role.id}`);
  } catch (error) {
    logError(`[createRole] Greška pri kreiranju role`, error, {
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    if (error.statusCode === 400 || error.statusCode === 409) {
      req.flash("error", error.message);
      const formData = prepareRoleFormData();

      return res.render("admin/_form", {
        pageTitle: "Nova rola",
        pageDescription: "Kreiraj novu rolu sa permisijama",
        data: { ...formData, errors: { general: error.message }, formData: req.body },
      });
    }
    next(error);
  }
}

export async function updateRole(req, res, next) {
  try {
    const { roleId } = req.params;

    if (req.validationErrors) {
      logWarn(`[updateRole] Validacione greške za roleId=${roleId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      const role = await roleService.getRoleById(roleId);
      const formData = prepareRoleFormData(role);

      return res.render("admin/_form", {
        pageTitle: `Izmena - ${role.osnovno.naziv}`,
        pageDescription: role.osnovno.opis || role.osnovno.naziv,
        data: { ...formData, errors: req.validationErrors, formData: req.body },
      });
    }

    const data = {};
    if (req.body.name) data.name = req.body.name;
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.permissions) data.permissions = Array.isArray(req.body.permissions) ? req.body.permissions : [];
    if (req.body.isDefault !== undefined) {
      data.isDefault = req.body.isDefault === "true" || req.body.isDefault === true || req.body.isDefault === "1";
    }
    if (req.body.isActive !== undefined) {
      data.isActive = req.body.isActive === "true" || req.body.isActive === true || req.body.isActive === "1";
    }
    if (req.body.priority !== undefined) data.priority = parseInt(req.body.priority, 10) || 0;

    await roleService.updateRole(roleId, data);

    logInfo(`[updateRole] Rola #${roleId} uspešno ažurirana`, {
      roleId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Rola je uspešno ažurirana");
    return res.redirect(`/admin/uloge/detalji/${roleId}`);
  } catch (error) {
    logError(`[updateRole] Greška pri ažuriranju role`, error, {
      roleId: req.params.roleId,
      body: req.body,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    if (error.statusCode === 400 || error.statusCode === 404 || error.statusCode === 409) {
      req.flash("error", error.message);
      return res.redirect(`/admin/uloge/izmena/${req.params.roleId}`);
    }
    next(error);
  }
}

export async function deleteRole(req, res, next) {
  try {
    const { roleId } = req.params;

    if (req.validationErrors) {
      logWarn(`[deleteRole] Validacione greške za roleId=${roleId}`, {
        validationErrors: req.validationErrors,
        userId: req.session?.user?.id || req.session?.user?._id,
      });
      req.flash("error", "Neispravan ID role");
      return res.redirect("/admin/uloge");
    }

    await roleService.deleteRole(roleId);

    logInfo(`[deleteRole] Rola #${roleId} uspešno obrisana`, {
      roleId,
      adminId: req.session?.user?.id || req.session?.user?._id,
    });

    req.flash("success", "Rola je uspešno obrisana");
    return res.redirect("/admin/uloge");
  } catch (error) {
    logError(`[deleteRole] Greška pri brisanju role`, error, {
      roleId: req.params.roleId,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    req.flash("error", error.message);
    return res.redirect("/admin/uloge");
  }
}

export async function searchRedirect(req, res, next) {
  try {
    const { search } = req.body;

    if (!search || !search.trim()) {
      return res.redirect("/admin/uloge");
    }

    return res.redirect(`/admin/uloge/pretraga/${encodeURIComponent(search.trim())}`);
  } catch (error) {
    logError(`[searchRedirect] Greška pri pretrazi rola`, error, {
      search: req.body.search,
      userId: req.session?.user?.id || req.session?.user?._id,
    });
    next(error);
  }
}

export default {
  listRoles,
  roleDetails,
  newRoleForm,
  createRole,
  updateRole,
  deleteRole,
  searchRedirect,
};