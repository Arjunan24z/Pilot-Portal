// src/routes/admin.routes.js
const express = require("express");
const auth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUser,
  deleteUser,
  getDashboard
} = require("../controllers/admin.controller");

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(requireRole(['admin']));

// Dashboard
router.get("/dashboard", getDashboard);

// User management
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserById);
router.put("/users/:userId/role", updateUserRole);
router.put("/users/:userId", updateUser);
router.delete("/users/:userId", deleteUser);

module.exports = router;
