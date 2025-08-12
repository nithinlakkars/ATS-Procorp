const authorizeRole = (requiredRoles) => {
  return (req, res, next) => {``
    const userRole = req.user?.role?.toLowerCase();

    if (!userRole) {
      return res.status(401).json({ error: "Unauthorized: No role found" });
    }

    if (!Array.isArray(requiredRoles)) {
      requiredRoles = [requiredRoles];
    }

    const normalizedRoles = requiredRoles.map((r) => r.toLowerCase());

    console.log("🔒 Role Check — required:", normalizedRoles, " | user has:", userRole);

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
};

export default authorizeRole;
