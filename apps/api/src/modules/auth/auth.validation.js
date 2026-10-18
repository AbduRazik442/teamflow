
export function validateRegistration(req, res, next) {
  const { name, email, password } = req.body ?? {};

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 80
  ) {
    return res.status(400).json({
      success: false,
      message: "Name must be between 2 and 80 characters.",
    });
  }

  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
    });
  }

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 72
  ) {
    return res.status(400).json({
      success: false,
      message: "Password must be between 8 and 72 characters.",
    });
  }

  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password ||
    password.length > 72
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email and password.",
    });
  }

  next();
}