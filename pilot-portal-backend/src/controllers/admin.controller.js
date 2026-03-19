/**
 * Admin Controller - User Management
 * 
 * Only accessible to users with 'admin' role
 */

const User = require("../models/user.model");

/**
 * Get all users (admin only)
 * GET /api/admin/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    
    res.json({
      message: "Users retrieved successfully",
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error("[Admin] Error getting users:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get user by ID (admin only)
 * GET /api/admin/users/:userId
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User retrieved successfully",
      data: user
    });
  } catch (error) {
    console.error("[Admin] Error getting user:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update user role (admin only)
 * PUT /api/admin/users/:userId/role
 * Body: { role: "admin" | "pilot" }
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['admin', 'pilot'].includes(role)) {
      return res.status(400).json({ 
        message: "Invalid role. Must be 'admin' or 'pilot'" 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: `User role updated to '${role}'`,
      data: user
    });
  } catch (error) {
    console.error("[Admin] Error updating user role:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update user status or info (admin only)
 * PUT /api/admin/users/:userId
 * Body: { name?, phone?, email? }
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (email) {
      // Check if email is already in use by another user
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      updateData.email = email;
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User information updated",
      data: user
    });
  } catch (error) {
    console.error("[Admin] Error updating user:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Delete user (admin only)
 * DELETE /api/admin/users/:userId
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User deleted successfully",
      deletedUserId: user._id
    });
  } catch (error) {
    console.error("[Admin] Error deleting user:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get dashboard statistics (admin only)
 * GET /api/admin/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const pilotCount = await User.countDocuments({ role: 'pilot' });

    res.json({
      message: "Dashboard statistics retrieved",
      stats: {
        totalUsers,
        adminCount,
        pilotCount,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error("[Admin] Error getting dashboard stats:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
