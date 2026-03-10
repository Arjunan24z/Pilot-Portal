// src/routes/auth.routes.js
const express = require("express");
const auth = require("../middleware/auth.middleware");
const {
	registerUser,
	loginUser,
	getCurrentUser
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", auth, getCurrentUser);

module.exports = router;
