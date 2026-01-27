const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const currencyService = require("../services/currency.service");

// Get complete currency status for current user
router.get("/status", authMiddleware, async (req, res) => {
  try {
    const currencyStatus = await currencyService.getCurrencyStatus(
      req.user.userId
    );
    res.json(currencyStatus);
  } catch (error) {
    console.error("Currency status error:", error);
    res.status(500).json({ message: "Error calculating currency status" });
  }
});

// Get flight hours breakdown
router.get("/hours", authMiddleware, async (req, res) => {
  try {
    const breakdown = await currencyService.getFlightHoursBreakdown(
      req.user.userId
    );
    res.json(breakdown);
  } catch (error) {
    console.error("Hours breakdown error:", error);
    res.status(500).json({ message: "Error calculating hours breakdown" });
  }
});

// Get specific currency details
router.get("/passenger", authMiddleware, async (req, res) => {
  try {
    const currency = await currencyService.calculatePassengerCurrency(
      req.user.userId
    );
    res.json(currency);
  } catch (error) {
    console.error("Passenger currency error:", error);
    res.status(500).json({ message: "Error calculating passenger currency" });
  }
});

router.get("/night", authMiddleware, async (req, res) => {
  try {
    const currency = await currencyService.calculateNightCurrency(
      req.user.userId
    );
    res.json(currency);
  } catch (error) {
    console.error("Night currency error:", error);
    res.status(500).json({ message: "Error calculating night currency" });
  }
});

router.get("/instrument", authMiddleware, async (req, res) => {
  try {
    const currency = await currencyService.calculateInstrumentCurrency(
      req.user.userId
    );
    res.json(currency);
  } catch (error) {
    console.error("Instrument currency error:", error);
    res.status(500).json({ message: "Error calculating instrument currency" });
  }
});

router.get("/flight-review", authMiddleware, async (req, res) => {
  try {
    const review = await currencyService.calculateFlightReview(req.user.userId);
    res.json(review);
  } catch (error) {
    console.error("Flight review error:", error);
    res.status(500).json({ message: "Error calculating flight review status" });
  }
});

module.exports = router;
