
export function validateWorkspace(req, res, next) {
  const { name, description } = req.body ?? {};

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "Workspace name must be between 2 and 100 characters.",
    });
  }

  if (
    description !== undefined &&
    (typeof description !== "string" || description.length > 500)
  ) {
    return res.status(400).json({
      success: false,
      message: "Description cannot exceed 500 characters.",
    });
  }

  next();
}

export function validateInvitation(req, res, next) {
  const { email, role } = req.body ?? {};

  if (
    typeof email !== "string" ||
    email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return res.status(400).json({
      success: false,
      message: "Provide a valid email address.",
    });
  }

  if (role !== undefined && !["admin", "member"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invitation role must be admin or member.",
    });
  }

  next();
}