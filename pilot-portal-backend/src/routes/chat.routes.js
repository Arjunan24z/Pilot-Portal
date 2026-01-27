const express = require("express");
const { chat } = require("../controllers/chat.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Chat route - requires authentication to provide personalized data
router.post("/", authMiddleware, chat);

module.exports = router;
