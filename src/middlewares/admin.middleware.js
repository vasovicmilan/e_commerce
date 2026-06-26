import * as roleService from "../services/role.service.js";

export async function adminMiddleware(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userRoleId = req.user.role;

    if (!userRoleId) {
      return res.status(403).json({ success: false, message: "No role assigned" });
    }

    const role = await roleService.getRoleById(userRoleId);

    if (!role) {
      return res.status(403).json({ success: false, message: "Role not found" });
    }

    if (!role.permisije || role.permisije.length === 0) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }

    req.userRole = role;
    next();
  } catch (error) {
    next(error);
  }
}